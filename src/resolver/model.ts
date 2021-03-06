import { ResolveTree } from "graphql-parse-resolve-info"
import {
	Model,
	ModelClass,
	ModelConstructor,
	QueryBuilder,
	RelationMappings,
} from "objection"

import { FieldResolver } from "./field"
import { ResolveTreeFn } from "./graph"
import { RelationResolver } from "./relation"

export type Modifier<M extends Model> = (qb: QueryBuilder<M, any>) => void

export interface ModelResolverOptions<M extends Model> {
	modifier?: Modifier<M>
	fields?: Record<string, SimpleFieldResolver<M>> | true
}

export type ModelResolverFn<M extends Model = Model> = (args: {
	tree: ResolveTree
	type: string
	query: QueryBuilder<M, any>
	resolve_tree: ResolveTreeFn
}) => void

export type SimpleFieldResolver<M extends Model> =
	| true
	| string
	| FieldResolverFn<M>

export type FieldResolverFn<M extends Model> = (
	query: QueryBuilder<M, any>,
	options: {
		// GraphQL field
		field: string
		// For drilling down
		tree: ResolveTree
		resolve_tree: ResolveTreeFn
	},
) => void

export function ModelResolver<M extends Model = Model>(
	model_class: ModelConstructor<M>,
	options?: ModelResolverOptions<M>,
): ModelResolverFn<M> {
	const model_options: ModelResolverOptions<M> = {
		// inject defaults here
		fields: true,
		...options,
	}

	const ThisModel = model_class as ModelClass<M>

	// Pull the list of getter names from Model
	// see https://stackoverflow.com/a/39310917/189806
	const getter_names = new Set(
		Object.entries(Object.getOwnPropertyDescriptors(ThisModel.prototype))
			.filter(([, descriptor]) => typeof descriptor.get === "function")
			.map(([key]) => key),
	)

	// List of model relations
	// Static-cast the value to RelationMappings, because if it was a thunk, it has been already resolved by now.
	const relations = ThisModel.relationMappings as RelationMappings

	// Default field resolver
	const get_field_resolver = (
		field: string,
		modelField?: string,
	): FieldResolverFn<M> => {
		const model_field_lookup = modelField || field
		if (getter_names.has(model_field_lookup)) {
			return () => undefined
		} else if (relations?.[model_field_lookup]) {
			return RelationResolver<M, any>({ modelField })
		} else {
			return FieldResolver<M>({ modelField })
		}
	}

	// Per-field resolvers
	const field_resolvers: Record<string, FieldResolverFn<M>> | null =
		model_options.fields === true ? null : {}
	if (field_resolvers) {
		const fields = model_options.fields as Record<string, FieldResolverFn<M>>
		for (const field of Object.keys(fields)) {
			const r0 = fields[field]
			let r: FieldResolverFn<M>
			if (typeof r0 === "function") {
				r = r0
			} else if (r0 === true) {
				r = get_field_resolver(field)
			} else if (typeof r0 === "string") {
				r = get_field_resolver(field, r0)
			} else {
				throw new Error(
					`Field resolver must be a function, string, or true; found ${r0}`,
				)
			}
			field_resolvers[field] = r
		}
	}

	return function resolve({ tree, type, query, resolve_tree }) {
		const ThisModel = query.modelClass()
		if (model_class !== (ThisModel as ModelConstructor<Model>)) {
			throw new Error(
				`Mismatching query model for ${type} model resolver (expected ${model_class}, found ${ThisModel})`,
			)
		}

		if (model_options.modifier) {
			model_options.modifier(query)
		}

		for (const subtree of Object.values(tree.fieldsByTypeName[type])) {
			const field = subtree.name
			const r = field_resolvers
				? field_resolvers[field]
				: get_field_resolver(field)
			if (!r) {
				throw new Error(`No field resolver defined for field ${type}.${field}`)
			}
			r(query, { field, tree: subtree, resolve_tree })
		}

		if (
			!query.has(
				((op: any) =>
					op.name === "select" && op.args[0] === ThisModel.idColumn) as any,
			)
		) {
			// Always select ID:
			// 1. This is useful for potential $query()
			// 2. This avoid automatic "select *" when not a single normal field was selected
			query.select(ThisModel.idColumn)
		}
	}
}

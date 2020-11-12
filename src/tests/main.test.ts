import gql from "graphql-tag"
import tap from "tap"

import { PostModel, SectionModel, UserModel } from "./models"
import { use_client, use_db } from "./setup"

tap.test("Main", async (tap) => {
	await use_db(tap)
	const client = await use_client(tap)

	await UserModel.query().insertGraph([
		{ id: 1, name: "John", password: "secret" },
		{ id: 2, name: "Mary" },
	])

	await SectionModel.query().insertGraph([
		{ id: 1, slug: "test", name: "Test" },
	])

	await PostModel.query().insertGraph(
		[
			{
				id: 1,
				author: { id: 1 },
				section: { id: 1 },
				title: "Hello",
				text: "Hello, world!",
			},
			{ id: 2, author: { id: 1 }, title: "Bye", text: "Bye-bye, cruel world!" },
			{ id: 3, author: { id: 2 }, title: "Foo" },
			{ id: 4, author: { id: 2 }, section: { id: 1 }, title: "Bar" },
		],
		{ relate: true },
	)

	tap.matchSnapshot(
		await client.request(
			gql`
				{
					user(id: 1) {
						id
						name
						posts {
							id
							title
							text
						}
					}
				}
			`,
		),
		"User with id 1 and his posts",
	)

	tap.same(
		await client.request(
			gql`
				{
					user(id: 800) {
						id
						name
					}
				}
			`,
		),
		{ user: null },
	)

	tap.matchSnapshot(
		await client.request(
			gql`
				{
					posts(filter: { author_id: 2 }) {
						id
						title
						author {
							name
						}
					}
				}
			`,
		),
		"Posts where author_id=2",
	)

	tap.matchSnapshot(
		await client.request(
			gql`
				{
					posts(filter: { title__in: ["Hello", "Foo"] }) {
						id
						title
					}
				}
			`,
		),
		"Posts where title is Hello or Foo",
	)

	tap.matchSnapshot(
		await client.request(
			gql`
				{
					posts(filter: { section_id: 1 }) {
						id
						title
						author {
							name
						}
						section {
							slug
						}
					}
				}
			`,
		),
		"Posts with both author and section (multiple relations)",
	)

	tap.matchSnapshot(
		await client.request(
			gql`
				{
					posts {
						url
					}
				}
			`,
		),
		"Posts with url only (test fields dependency)",
	)

	tap.matchSnapshot(
		await client.request(
			gql`
				{
					posts {
						url
						section {
							name
						}
					}
				}
			`,
		),
		"Posts with url and section without slug (test nested fields dependency)",
	)

	tap.rejects(
		client.request(
			gql`
				{
					user(id: 1) {
						name
						password
					}
				}
			`,
		),
		"Reject retrieving user password (field not defined in schema)",
	)
})
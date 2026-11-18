# Data layer

Everything the app reads or writes goes through one Effect `HttpApi` definition and the typed client built from it. In development and tests the client talks to in-memory mocks; set `VITE_KIKI_API_URL` to point the same client at a real backend.

## Layout

| Path                    | What lives there                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `api/Api.ts`            | `KikiApi`, the root `HttpApi` with all 61 groups, plus `groupIds`.                                     |
| `api/groups/<group>.ts` | One `HttpApiGroup` per group, with every endpoint from Capy's bundle (703 in total).                   |
| `api/schemas/`          | Domain schemas decoded from the bundle (`ids`, `user`, `organization`, `project`, `thread`, `errors`). |
| `api/undecoded.ts`      | `Undecoded` and `UndecodedQuery`, placeholders for shapes nobody has decoded yet.                      |
| `api/annotations.ts`    | `InferredMethod`, set on endpoints whose HTTP method was not read directly from a factory call.        |
| `client/`               | `ApiClient` (typed client and atom factory), transports, and the `Session` service.                    |
| `mocks/<group>/`        | One folder per group: `index.ts` exports the group's mock layer, `fixtures.ts` its sample data.        |
| `mocks/MockServices.ts` | Serves every mock group as an in-memory HTTP handler and exposes it as `MockTransport`.                |
| `atoms/`                | effect-atom conventions and the shared query atoms.                                                    |
| `realtime/`             | `ThreadEventStream` (SSE `events/stream`), `RealtimeSocket` (WebSocket) and their fake emitters.       |
| `events/`               | Reserved for A8: the thread event schemas decoded from the bundle.                                     |

## How a request flows

`ApiClient` is an `AtomHttpApi.Service` over `KikiApi`. Its HTTP client is `ApiTransport`:

- **mock** (default, no `VITE_KIKI_API_URL`): `FetchHttpClient` whose `fetch` is the web handler built from `HttpApiBuilder.layer(KikiApi)` plus every mock group. Requests are encoded, routed, handled and decoded exactly as they would be over the network, so a schema mistake fails in the mock too.
- **live**: plain `FetchHttpClient` against `VITE_KIKI_API_URL`.

Feature code never knows which one it has.

## Reading an atom whose key is an id

Never read a family atom with a placeholder id. `allThreadsAtom("" as OrgId)` and its four neighbours do not return "empty" — they issue a real request to `/orgs//jams`, which the API answers with a 403, and Effect's `HttpApiClient` deduplicates failure reasons by structurally hashing the whole error graph. Five of those per mount cost 2.8 million hash calls and ~18s of CPU inside a route tree (kiki#351).

Read the id first and hold the subscription until it exists:

```ts
const orgId = organizations?.[0]?.id;
const threads = useAtomValue(orgId === undefined ? idleThreadsAtom : allThreadsAtom(orgId, options));
```

An idle atom that already holds a success value is free to subscribe to; a family atom with a fabricated key is not. `sidebarAtoms(orgId)` in `features/sidebar/sidebar-threads-data/live-source.ts` is the worked example.

## Adding or typing an endpoint

Every endpoint already exists in `api/groups/<group>.ts`, with exact names, paths and path params. Endpoints that nobody has decoded yet use `Undecoded` for the payload and success, and `UndecodedQuery` for the query string, so callers pass `query: {}`.

To type one:

1. Read its definition in Capy's bundle (search for `\`<name>\`,\`<path>\``) and decode the schemas it references.
2. Add the schemas under `api/schemas/`, one file per domain. Use the bundle's class names and identifiers, branded ids from `ids.ts`, `Timestamp` for dates, and `withDefault` where the bundle declares a decoding default. Leave nested shapes you don't need as `Schema.Unknown` rather than guessing.
3. Replace the endpoint's `Undecoded` options with the real `params`, `query`, `payload`, `success` and `error` schemas.
4. Keep the `.annotate(InferredMethod, true)` marker if it is there. It means api.md had to infer the method; the method in the group file was resolved through the bundle's import map and agrees with every directly read method, but it is still worth a look when you type the endpoint.

## Filling a mock

Unfilled endpoints answer `501` with `{ _tag: "MockNotImplemented", group, endpoint }`, so a screen that calls one fails loudly instead of rendering invented data.

To fill a group, edit `mocks/<group>/index.ts`:

```ts
export const ProjectsMock = mockGroup("projects", (handlers) =>
  Effect.gen(function* () {
    const projects = yield* Ref.make(sampleProjects);
    return handlers
      .handle("list", () => Ref.get(projects))
      .handle("delete", ({ params }) => /* update the Ref */);
  }),
);
```

- `mockGroup` fills every endpoint you don't handle with the 501 response, so you only write the ones your package needs.
- Keep state in a `Ref` created inside the builder. Each `MockTransport` (and each atom registry) gets fresh state, so tests don't leak into each other.
- Return schema class instances (`new Project({...})`), because the response is encoded with the endpoint's schema.
- Put sample data in `fixtures.ts` next to the mock. **Fixtures are neutral sample data** (Acme, Alex Morgan, `acme/web`). Never copy anything from the captures: no real account, project, thread, repo, theme or person names. Use `fixtures/time.ts` for timestamps so they stay deterministic.
- `jams`, `projects`, `organizations` and `users` are working examples.

### The shared fake org

Every group draws from one fake organization so screens agree with each other: the issue an issue list shows is the issue a pull links to, owned by a member the members page lists.

- `mocks/fixtures/world.ts` is the cast: the Acme org, five members, projects, repos, threads, captains, issue states, labels and issues, pulls, cloud machines and devices, automations, folders, tags, MCP servers, API keys, models and drive files. Ids are stable (`user_sample_alex`, `ACME-3`, `pr_sample_128`), and `isoMinutesAgo` gives deterministic ISO timestamps for undecoded JSON.
- `mocks/db/MockDb.ts` holds the mutable tables seeded from `world`. A group that reads or writes shared entities takes them from `MockDb` (`const { issues } = yield* MockDb`) instead of its own copy, so a write in one group shows up in another. State private to one group stays in a `Ref` inside that group's builder. `fields(payload)` reads an undecoded payload, `newId(prefix)` mints ids, and `missing(table, id)` fails an unknown id loudly.
- The tables hold Acme only. Mocks don't scope by `params.orgId`, so any org id gets Acme's data; screens that switch org see the same rows.
- Endpoints still typed `Undecoded` return plain JSON. Its shape is inferred from the endpoint name and the screen that uses it, not read from Capy's bundle, so treat it as provisional: when someone types the endpoint, the mock's response must be brought in line with the real schema.
- Each group has a wiring test next to its mock (`mocks/<group>/<group>.test.ts`) that drives its endpoints through `ApiClient.query` and `ApiClient.mutation` atoms and checks that a mutation refreshes the queries sharing its reactivity key. `issue-labels` is the reference.

## Atoms

Follow `atoms/conventions.ts`, which mirrors how Capy's bundle builds its atoms:

- Build query atoms with `ApiClient.query(group, endpoint, request)` and mutations with `ApiClient.mutation(group, endpoint)`.
- Every query sets `reactivityKeys` from `reactivityKeys` in `conventions.ts` and `timeToLive: queryTimeToLive`. Mutations pass the same keys so the queries they affect refetch.
- Parameterised atoms use `Atom.family` keyed by a primitive (an id or a joined string, as `threadsAtom` does), because families compare keys by reference.
- Atoms live in `atoms/<domain>.ts`; feature folders import them and never call the client directly from components.

## Realtime

- `ThreadEventStream.stream({ orgId, jamId, after })` yields raw SSE frames (`id`, `event`, `data`) from `GET /orgs/:orgId/jams/:jamId/events/stream`. Decoding `data` into typed events belongs to A8 (`events/`). `layerLive` uses the HTTP client; `ThreadEventStreamFake` also provides `FakeThreadEvents`, an emitter tests and demos push frames into.
- `RealtimeSocket` exposes `messages` and `send`. Only the fake (`RealtimeSocketFake`, with `FakeRealtimeSocket` to emit server messages and inspect sent ones) exists, because the realtime host's protocol hasn't been decoded.

## Testing

Use `@effect/vitest`:

- Client and services: `layer(makeApiClientLayer(MockTransport))(...)`, then `yield* ApiClient`.
- Atoms: `AtomRegistry.getResult(AtomRegistry.make(), someAtom)`. Atoms use `ApiTransport`, which is the mock in tests.
- Realtime: provide the fake layer and drive it through its emitter.

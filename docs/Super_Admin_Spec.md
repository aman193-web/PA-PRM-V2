# Super admin panel (PRM platform team)

The twelve portals are all inside one customer, Brightline. The super admin panel sits above every customer. It's for the PRM's own platform team, and Rowan Ellis is the demo super admin. Routes are `#/s/…`.

The BRD doesn't describe this layer. The hub records it as gaps G52 and G53. Names, prices and figures are examples.

## 1. Who signs in, and how

| Platform role | Can do |
|---|---|
| Super admin | Everything below, plus the platform team, policies and kill switches |
| Support | Ask a tenant for read-only support access; see health and incidents |
| Billing | Plans, invoices and payment status; no customer data |
| Security | Security events, policies (read) and the platform audit log |
| Read-only | See every page; change nothing |

- **Sign-in:** platform SSO plus a hardware security key, from the office network or VPN only. Email links and app codes aren't allowed. See the dedicated sign-in page at `#/signin/super`.
- **Production marker:** the header always shows a red **Production** chip. Every change goes to the platform audit log with the person's name.

## 2. Navigation

| Group | Page | What it's for |
|---|---|---|
| | Overview | Customers, people, MRR, agent actions and uptime. Also what needs attention, the platform controls and recent changes. |
| Customers | Organizations | List and filter tenants. **New organization** sets the plan, region, first admin (who must be on the tenant's domain) and an optional 14-day trial. |
| | Organization detail | Suspend (a reason is required) or reactivate, change the plan, set the AI spend cap, and switch features per tenant. Also invoices, the profile, and asking for support access. |
| | Users | Directory of everyone across every tenant. Lock, unlock, reset MFA and sign out everywhere. |
| | Roles and permissions | The default role templates from the hub's permission matrix, overridable per permission. Credit-change and cross-partner rows are locked. |
| | Plans and billing | Plans with what each includes, MRR, and invoices you can mark paid or remind about. |
| Product | Features and releases | Feature × tenant switches, **On / Off for all**, and release rollout in steps of 25%. |
| | AI platform | Approve or block AI providers, agent versions, AI spend per tenant, and the kill switch. |
| | Integrations and API | The connector catalog with tenants and error rates, plus API, webhook and MCP numbers. |
| Trust | Security and access | Platform policies (some are locked), security events across tenants, and support access. |
| | Audit log | Platform audit log, filterable by organization and person, with export. Append-only (R-SEC-6). |
| | Data and compliance | Export and erasure requests, retention, and data residency per tenant. |
| Operations | System health | Services, incidents, CRM sync lag per tenant, and the platform controls. |
| | Announcements | Compose a banner (news or maintenance), pick the audience, preview it, publish it and take it down. |
| | Usage analytics | Users, decisions and agent actions by month, module adoption, and usage per tenant. |
| Settings | Platform team | The team, the platform roles, and inviting someone (`@prm-platform.io` only). |
| Foot of the menu | The five journeys | The super admin's flows, step by step, each opening its screen: bring on a customer, handle a security event, ship a release, keep AI safe and affordable, and billing and customer data. |
| | Your access | What the super admin can and can't do, how they sign in, and the platform roles. |

The header has search across organizations and people, an alerts bell, the theme toggle and the account menu. On phones, the sidebar becomes a menu sheet.

## 3. What reaches the customer portals

| Done in the super admin panel | Seen in Brightline's portals |
|---|---|
| Publish an announcement to All tenants, Brightline or Enterprise customers | A banner at the top of every page in every Brightline portal, staff and partners alike. People can hide it. |
| Turn on maintenance mode | A read-only banner in every portal |
| Pause every AI agent (kill switch) | Lee sees the agent layer paused. Jordan decides by hand, and the rules still approve clean deals. |
| Switch co-sell off for Brightline | Sam loses the Co-sell page, and finding a partner shows "Switched off for Brightline" |
| Ask Brightline for support access | Kai sees the request on Home and in Users and roles, and approves (read-only, 2 hours) or declines. The decision is logged in both audit logs. |

## 4. Rules the panel keeps

- **Customer data is the customer's.** Support access always needs the tenant's approval. It's read-only, has a time limit and is logged. This policy is locked on.
- **MFA for every tenant's staff is locked on** (R-SEC-5).
- **No platform setting can let an agent** move money, change access, export data, or demote or terminate a partner (R-AG-2).
- **Changes that affect every tenant ask for confirmation first:** the kill switch, maintenance mode, and turning a feature on or off for everyone.

## 5. Not designed yet

- **Break-glass access** without the customer's approval during a severe incident (G53).
- **Real payment collection, tax and dunning.** Invoices here are examples.
- **Per-region platform teams,** and whether EU tenants should only be supported from the EU.
- **Creating incidents from the panel.** For now, only their status can be changed.

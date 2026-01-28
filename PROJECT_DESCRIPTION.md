# Canton Analytics — Network Dashboard

**Live dashboard:** **[https://canton.moonlet.dev/](https://canton.moonlet.dev/)**

---

## What we built

We built a **single, unified analytics dashboard** for the Canton Network. It’s one place to see consensus, validators, governance, updates, and operator-oriented metrics. The dashboard is dark-themed and uses data from public network APIs. Built by **Moonlet** for the Canton ecosystem.

---

## Features

**Home — Network overview**

On the home page you get the big picture:

- **Economics** — Latest round and consensus height at a glance.
- **Validator liveness** — Bar chart of liveness vs missed rounds (top 12), with links to validator details.
- **Governance** — DSO state, voting threshold, and open votes with Accept/Reject counts.
- **Tenants & SLA (operator view)** — Per-validator uptime, SLA %, missed rounds, last incident.
- **Reward attribution (operator view)** — Per-tenant reward attribution in CC from on-chain liveness.

**Updates**

You can browse network-wide update activity with record time and parties. Each update can be opened for a full **detail page** with payload and metadata.

**Validators**

- **Liveness & missed-rounds chart** for the top validators.
- **Paginated table** of all validators: ID, sponsor, status, liveness rounds, missed rounds, last active.
- **Validator detail page** for each row with a deeper view.

**Super Validators**

- DSO stats and the full **SV node list** with status.
- Pagination and clear status indicators.

**Governance**

- **Open votes** table with vote ID, status, Accept/Reject counts.
- **Vote detail pages** — Requester, reason, action, and full vote payload.

**More from the hub**

From the analytics hub you can reach:

- **Validator FinOps** — Traffic burn vs rewards, runway forecast, scenario modeling.
- **Operator Console** — Multi-tenant view, SLA, reward attribution, invoiceable statements.
- **Incidents** — Anomaly detection and operational risk view.
- **Featured Apps** — Reward share proxy from validator liveness.
- **Transfers / Offers / Preapprovals** — Activity views with latest round and global activity summary.
- **Compliance Vault** — Placeholder for evidence and controlled exports (not yet wired to data).

---

## What we emphasize

- **One place for operators** — Round, consensus, validators, governance, and rewards in a single dashboard.
- **On-chain data** — Sourced from public network APIs; liveness and reward attribution from consensus and validator licenses.
- **Governance visibility** — Open votes and full vote details to track proposals and outcomes.
- **Drill-down everywhere** — Updates, validators, and governance votes all have detail pages.
- **Clean, responsive UI** with loading tuned to respect rate limits.

---

**Canton Analytics dashboard:** **[https://canton.moonlet.dev/](https://canton.moonlet.dev/)**

— **Moonlet**

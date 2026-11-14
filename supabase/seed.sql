-- Crewkit demo seed data.
-- Run after the migration. Safe to run more than once.
--
-- IMPORTANT: create the matching auth users in Supabase first:
--   Dashboard -> Authentication -> Users -> Add user
--   hr@crewkit.demo       (choose a password)
--   employee@crewkit.demo (choose a password)
-- Then change these emails to your real team's addresses.

insert into crewkit.members (email, full_name, role) values
  ('hr@crewkit.demo', 'Crewkit HR', 'hr'),
  ('employee@crewkit.demo', 'Crewkit Employee', 'employee')
on conflict (lower(email)) do update
  set full_name = excluded.full_name,
      role = excluded.role;

insert into crewkit.categories (slug, name, description, icon, sort_order) values
  ('getting-started', 'Getting Started', 'New here? Start with the essentials.', 'Rocket', 1),
  ('hr-benefits', 'HR & Benefits', 'Leave, payroll, policies, and perks.', 'HeartHandshake', 2),
  ('it-tools', 'IT & Tools', 'Laptops, accounts, VPN, and troubleshooting.', 'Laptop', 3),
  ('finance-expenses', 'Finance & Expenses', 'Reimbursements, budgets, and spending.', 'Wallet', 4)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      sort_order = excluded.sort_order;

insert into crewkit.tags (slug, name) values
  ('onboarding', 'Onboarding'),
  ('tickets', 'Tickets'),
  ('leave', 'Leave'),
  ('payroll', 'Payroll'),
  ('benefits', 'Benefits'),
  ('laptop', 'Laptop'),
  ('vpn', 'VPN'),
  ('security', 'Security'),
  ('expenses', 'Expenses')
on conflict (slug) do update set name = excluded.name;

insert into crewkit.articles (slug, title, summary, content, category_id, status, view_count, published_at)
values
  (
    'welcome-to-crewkit',
    'Welcome to Crewkit',
    'Your one-stop hub for the questions you would usually ask in a group chat.',
    $md$# Welcome to Crewkit

Crewkit is the place to find answers before you have to ask. It collects the small things that slow us down: where a form lives, who approves leave, and how to get your laptop replaced.

## How to use it

1. **Search first.** Type a few words into the search bar on the Knowledge Base page.
2. **Browse by topic.** Every article belongs to a category such as HR & Benefits or IT & Tools.
3. **Ask for help.** If nothing answers your question, submit a ticket. HR will pick it up and reply in the thread.

## A few ground rules

- Keep article content accurate. If you spot something outdated, tell HR.
- Do not paste passwords, ID numbers, or customer data into a ticket.
- Attachments are private. Only you and HR can see them.

That is it. Welcome aboard.$md$,
    (select id from crewkit.categories where slug = 'getting-started'),
    'published',
    128,
    now() - interval '21 days'
  ),
  (
    'how-to-submit-a-ticket',
    'How to submit a ticket',
    'When the knowledge base does not have the answer, open a ticket and track it to resolution.',
    $md$# How to submit a ticket

Tickets are for concerns that the knowledge base cannot answer. You can submit one in under a minute.

## Steps

1. Go to **Submit a ticket** in the sidebar.
2. Give it a clear subject, for example *"Payroll deduction looks wrong"*.
3. Pick the closest category and a priority.
4. Describe what happened, what you expected, and what you already tried.
5. Attach screenshots or documents if they help. Up to 3 files, 10 MB each.
6. Submit.

## What happens next

- Your ticket gets a reference like **CK-1001**.
- HR reads it and replies in the thread.
- You can reply at any time from **My tickets**.
- Only HR can change the status. When it is resolved, you will see it on the ticket.

## Priority guide

| Priority | Use it when |
| --- | --- |
| Low | A nice-to-have or general question |
| Normal | You are blocked but have a workaround |
| High | You cannot do your job right now |
| Urgent | Payroll, access, or safety is affected |

If in doubt, choose **Normal**.$md$,
    (select id from crewkit.categories where slug = 'getting-started'),
    'published',
    96,
    now() - interval '18 days'
  ),
  (
    'requesting-time-off',
    'Requesting time off',
    'How to file leave, how far ahead to plan, and who signs off.',
    $md$# Requesting time off

Everyone needs a break. Here is how leave works at Crewkit.

## Before you file

- Check the team calendar so you are not leaving a critical week uncovered.
- File at least **5 working days** ahead for planned leave.
- For sick leave, file as soon as you are able. Same-day is fine.

## Filing leave

1. Open the HR portal and choose **New leave request**.
2. Select the leave type: vacation, sick, or unpaid.
3. Add your dates and a short note for your manager.
4. Submit. You will get a confirmation email.

Your manager approves first, then HR confirms the balance.

## Balances

- Vacation days reset on **1 January**.
- Up to **5 unused days** carry over to the next year.
- Sick leave does not carry over.

## If something goes wrong

If your balance looks wrong or a request is stuck, submit a ticket under **HR & Benefits** and attach the request ID.$md$,
    (select id from crewkit.categories where slug = 'hr-benefits'),
    'published',
    74,
    now() - interval '14 days'
  ),
  (
    'understanding-your-payslip',
    'Understanding your payslip',
    'A line-by-line guide to the numbers on your monthly payslip.',
    $md$# Understanding your payslip

Payslips land on the **25th** of each month, or the previous working day when the 25th falls on a weekend.

## The main lines

- **Gross pay** - your salary for the period before deductions.
- **Allowances** - transport, meal, and internet allowances where applicable.
- **Statutory deductions** - tax and mandated contributions.
- **Benefits** - health coverage and other pre-tax deductions.
- **Net pay** - what actually reaches your bank account.

## Common questions

### Why did my net pay change?

Check for a new deduction, a change in allowances, or a tax bracket adjustment. A one-off adjustment usually appears with a note.

### Where do I find old payslips?

The HR portal keeps the last **24 months**. Download a PDF from **Payroll -> History**.

### Something looks wrong

Submit a ticket under **Payroll** within **10 days** of receiving the payslip. Include the pay period and the line that looks off. Do not attach your full payslip if it contains bank details; a screenshot of the affected line is enough.$md$,
    (select id from crewkit.categories where slug = 'hr-benefits'),
    'published',
    152,
    now() - interval '11 days'
  ),
  (
    'setting-up-your-work-laptop',
    'Setting up your work laptop',
    'From unboxing to your first login, including the apps everyone needs.',
    $md$# Setting up your work laptop

Your laptop arrives with a standard image. This guide gets you productive on day one.

## First login

1. Connect to power and turn it on.
2. Sign in with your company account. The first login can take a few minutes while policies apply.
3. Set up the screen lock and biometric unlock if available.
4. Connect to the office Wi-Fi. At home, use the VPN for internal tools.

## Install the basics

- **Password manager** - required for all work accounts.
- **Chat and email** - already installed; sign in with your company account.
- **Browser profile** - sign in to sync bookmarks, then keep personal browsing separate.

## Security checklist

- Enable full-disk encryption (on by default).
- Keep automatic updates on.
- Never install software from unverified sources.
- Report a lost or stolen laptop immediately. Do not wait until morning.

## Hardware issues

If a key sticks, the battery drains unusually fast, or the screen flickers, submit a ticket under **IT & Tools** with your asset tag and a short video if possible.$md$,
    (select id from crewkit.categories where slug = 'it-tools'),
    'published',
    88,
    now() - interval '9 days'
  ),
  (
    'connecting-to-the-vpn',
    'Connecting to the VPN',
    'Get secure access to internal tools when you are working remotely.',
    $md$# Connecting to the VPN

Use the VPN whenever you are away from the office and need internal tools such as the HR portal, shared drives, or staging environments.

## Install the client

1. Open the software center on your laptop.
2. Install **Crewkit VPN**.
3. Launch it and sign in with your company account.

## Connect

1. Choose the region closest to you.
2. Click **Connect**.
3. Wait for the status to read **Connected**. This usually takes under 10 seconds.

## Troubleshooting

- **Stuck on "Authenticating"** - sign out and back in, then retry.
- **Connected but pages will not load** - disconnect and reconnect to refresh routes.
- **Frequent drops** - switch to a stable network and avoid public Wi-Fi where possible.

Still stuck? Submit an **IT & Tools** ticket and include the error message and your operating system version.$md$,
    (select id from crewkit.categories where slug = 'it-tools'),
    'published',
    61,
    now() - interval '6 days'
  ),
  (
    'submitting-expenses',
    'Submitting expenses',
    'What counts as reimbursable, how to file, and when to expect payment.',
    $md$# Submitting expenses

Keep receipts, file within 30 days, and use the right category. That is most of it.

## What is reimbursable

- Travel booked for work, including approved taxis and parking.
- Meals during approved work travel, within the daily limit.
- Materials bought for a project with prior approval.
- Software required for your role, approved by your manager.

Personal purchases, upgrades without approval, and alcohol are not reimbursable.

## Filing a claim

1. Open the finance portal and choose **New expense**.
2. Add the date, amount, currency, and category.
3. Attach a clear photo or PDF of the receipt.
4. Add a one-line business reason.
5. Submit for manager approval.

## Payment timeline

Approved claims are paid with the **next payroll run**. Claims submitted after the 20th usually land the following month.

## Missing receipts

If a receipt is lost, add a short note explaining why and attach your card statement with unrelated lines redacted. Repeated missing receipts may need manager sign-off.$md$,
    (select id from crewkit.categories where slug = 'finance-expenses'),
    'published',
    57,
    now() - interval '4 days'
  ),
  (
    'keeping-work-data-safe',
    'Keeping work data safe',
    'Simple habits that prevent the most common security mistakes.',
    $md$# Keeping work data safe

Security is mostly small habits repeated every day. These cover the mistakes we see most often.

## Passwords and sign-in

- Use the password manager. Do not reuse passwords.
- Turn on two-factor authentication everywhere it is offered.
- Never share a one-time code, even with someone claiming to be IT.

## Sharing files

- Share with named people, not "anyone with the link".
- Check the recipient list before sending.
- Remove access when a project ends.

## Handling sensitive data

- Do not paste customer data into external tools or AI assistants.
- Lock your screen when you step away.
- Keep work files on company storage, not personal drives.

## Phishing

Slow down when a message creates urgency, asks for credentials, or has an unexpected attachment. Verify the sender through a separate channel before acting.

If you think you clicked something you should not have, report it immediately. Fast reporting is always better than a perfect record.$md$,
    (select id from crewkit.categories where slug = 'finance-expenses'),
    'published',
    103,
    now() - interval '2 days'
  )
on conflict (slug) do update
  set title = excluded.title,
      summary = excluded.summary,
      content = excluded.content,
      category_id = excluded.category_id,
      status = excluded.status,
      view_count = excluded.view_count,
      published_at = excluded.published_at;

insert into crewkit.article_tags (article_id, tag_id)
select a.id, t.id
from (values
  ('welcome-to-crewkit', 'onboarding'),
  ('how-to-submit-a-ticket', 'tickets'),
  ('requesting-time-off', 'leave'),
  ('requesting-time-off', 'benefits'),
  ('understanding-your-payslip', 'payroll'),
  ('understanding-your-payslip', 'benefits'),
  ('setting-up-your-work-laptop', 'laptop'),
  ('setting-up-your-work-laptop', 'onboarding'),
  ('connecting-to-the-vpn', 'vpn'),
  ('connecting-to-the-vpn', 'security'),
  ('submitting-expenses', 'expenses'),
  ('keeping-work-data-safe', 'security')
) as mapping (article_slug, tag_slug)
join crewkit.articles a on a.slug = mapping.article_slug
join crewkit.tags t on t.slug = mapping.tag_slug
on conflict do nothing;

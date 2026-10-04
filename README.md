# Customer Support Portal Frontend

Frontend application for the **Customer Support Portal** developed during the **Sharp Minds Cloud Tech Pvt. Ltd. Internship Program 2026**.

The Customer Support Portal enables customers of **MSME Sales Booster ERP** to raise support requests, communicate with the support team, upload supporting documents, and track the status of their complaints without relying on phone calls or emails.

This application is being developed as a standalone project and will later be integrated into the MSME Sales Booster ERP.

---

# Problem Statement

Customers currently contact the support team through phone calls, WhatsApp, or emails whenever they face issues while using the ERP. This makes it difficult to track complaints, monitor response times, and maintain a complete service history.

The objective of this project is to develop a modern web application where customers can raise support tickets, communicate with the support team, upload attachments, and monitor the progress of their requests in real time.

---

# Technology Stack

- Next.js (Pages Router)
- React
- TypeScript
- Redux Toolkit
- Ant Design
- Axios
- React Hook Form
- SCSS

---

# Installation

Clone the repository

```bash
git clone https://github.com/surajrai1390p-hue/support-portal-web.git
```

Navigate to the project

```bash
cd support-portal-web
```

Install dependencies

```bash
npm install
```

Create a `.env.local` file (copy the provided example)

```bash
copy .env.example .env.local
```

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:5000` |

Run the development server

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

# Folder Structure

```
pages                 # Next.js pages (routes)
│
├── _app.tsx
├── _document.tsx
├── index.tsx         # Landing / redirect
├── login.tsx
├── register.tsx
├── forgot-password.tsx
├── complaints/       # Raise, list and view complaints
└── dashboard/        # Customer & support dashboards
│
src
├── components        # Reusable UI components
├── config            # Complaint & theme configuration
├── lib               # Date utilities
└── store             # Redux Toolkit store & slices
│
lib                   # Axios API client (lib/api.ts)
styles                # Global styles and CSS modules
public                # Static assets (images)
```

---

# User Roles

## Administrator

Administrator can

- Login
- View All Tickets
- Assign Tickets
- Change Ticket Status
- Reply to Customers
- Close Tickets
- Search Tickets
- View Dashboard

---

## Customer

Customer can

- Login
- Raise Support Ticket
- View My Tickets
- Reply to Ticket
- Upload Attachments
- Cancel Ticket
- Track Ticket Status

---

# Modules

The frontend will include the following modules.

- Authentication
- Dashboard
- Ticket Management
- Ticket Details
- Ticket Conversation
- File Upload
- User Profile

---

# Ticket Categories

The application should initially support the following categories.

- Inquiry
- Quotation
- Customer Order
- Sales Invoice
- Purchase
- Inventory
- Production
- Accounts
- General Support

---

# Ticket Status

The application should display the following ticket statuses.

```
Open

Assigned

In Progress

Waiting for Customer

Resolved

Closed

Cancelled
```

---



---

# Dashboard

## Administrator Dashboard

Display

- Total Tickets
- Open Tickets
- Assigned Tickets
- In Progress Tickets
- Waiting for Customer
- Resolved Tickets
- Closed Tickets

---

## Customer Dashboard

Display

- My Tickets
- Open Tickets
- Resolved Tickets
- Recently Updated Tickets

---

# Screens

The application should include the following screens.

- Login
- Dashboard
- My Tickets
- Raise Ticket
- Ticket Details
- User Profile
- Administrator Dashboard
- Ticket Management

---

# Coding Standards

- Use TypeScript.
- Use Redux Toolkit for global state management.
- Use Axios for all API communication.
- Use React Hook Form for forms.
- Keep components reusable.
- Avoid duplicate code.
- Use meaningful variable and function names.
- Follow the project folder structure.
- Remove unused imports before committing.

---

# Git Workflow

Do **NOT** commit directly to the `main` branch.

Create a feature branch before starting development.

Example

```bash
git checkout -b feature/ticket-management
```

After completing your work

```bash
git add .

git commit -m "Implemented Ticket Management UI"

git push origin feature/ticket-management
```

Create a Pull Request for review.

---

# Commit Message Examples

Good

```
Implemented Login Screen

Created Dashboard Layout

Added Raise Ticket Form

Implemented Ticket Listing

Added Ticket Details Page

Integrated Authentication APIs

Implemented File Upload
```

Avoid

```
Done

Final

Update

Testing

abc
```

---

# Team Expectations

Every intern is expected to

- Write clean and readable code.
- Follow the project architecture.
- Commit code regularly.
- Use feature branches.
- Raise Pull Requests.
- Participate in code reviews.
- Keep documentation updated.
- Work collaboratively with team members.

---

# Deliverables

By the end of the internship, the frontend should support

- User Authentication
- Dashboard
- Raise Support Ticket
- Ticket Listing
- Ticket Details
- Ticket Conversation
- File Upload
- Search & Filter
- Responsive User Interface

---

# Future Scope

The Customer Support Portal will later be integrated into the **MSME Sales Booster ERP**, allowing customers to raise and monitor support tickets directly from within the ERP.

Future enhancements may include

- Live Chat
- Push Notifications
- Email Notifications
- SLA Dashboard
- Customer Feedback
- Knowledge Base Integration
- Jira Integration
- Analytics & Reports

---

# Maintained By

**Sharp Minds Cloud Tech Pvt. Ltd.**

**MSME Sales Booster ERP Team**

**Internship Program 2026**

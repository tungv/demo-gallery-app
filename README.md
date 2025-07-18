# Forget Me Note - Collaborative Shopping List App

A modern, accessible web application for managing shared shopping lists with multiple users. Built with Next.js 15, React 19, and TypeScript.

## Features

- **User Authentication**: Secure registration and login system
- **Collaborative Lists**: Multiple users can contribute to the same shopping list
- **Invitation System**: Share lists via invitation links
- **Shop Organization**: Tag items by shop for efficient shopping trips
- **Status Management**: Mark items as "to buy today" or "bought"
- **Notes**: Add optional notes to items for additional details
- **Real-time Updates**: Server-side data fetching with automatic updates
- **Accessibility**: WCAG 2.2 compliant with full keyboard navigation and screen reader support

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS v4
- **Database**: Vercel Postgres
- **Authentication**: JWT with jose library
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (or Vercel Postgres)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/forget-me-note.git
cd forget-me-note
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
# Create a .env.local file with:
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secret_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Run the development server:
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The app uses the following main tables:
- `users`: User accounts
- `shopping_lists`: Shopping list metadata
- `shopping_list_members`: List membership and invitations
- `shopping_items`: Individual items in lists
- `shops`: Shop/store tags for organization

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── login/             # Authentication pages
│   ├── register/
│   ├── dashboard/         # User's lists overview
│   ├── lists/[id]/        # Individual list view
│   └── join/[code]/       # Invitation acceptance
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── lib/                  # Utilities and core logic
│   ├── auth.ts          # Authentication functions
│   ├── db/              # Database schema
│   └── types.ts         # TypeScript types
└── utils/               # Helper functions
```

## Accessibility Features

- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader announcements
- Form validation with accessible error messages

## Security

- Password hashing with bcrypt
- JWT tokens for session management
- SQL injection prevention via parameterized queries
- CSRF protection through server actions
- Secure HTTP-only cookies

## Development Guidelines

### Server Components by Default
- Use server components for data fetching
- Client components only for interactivity

### Database Queries
- All queries use parameterized statements
- Proper access control checks
- Optimistic updates with revalidation

### UI Components
- Built on Radix UI primitives
- Custom styling with Tailwind CSS
- Consistent design system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Open a pull request

## License

MIT License - see LICENSE file for details

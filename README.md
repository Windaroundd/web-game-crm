# Website & Game Management System (CMS)

A comprehensive Content Management System built with **Next.js 15** and **Supabase** for managing websites, games, Cloudflare accounts, and textlinks. This system provides both admin interfaces and public APIs for content management and distribution.

## 🚀 Features

### Core Modules

- **Website Management**: CRUD operations for website listings with SEO metrics
- **Game Management**: Game catalog with file uploads and metadata
- **Cloudflare Integration**: Multi-account cache purging with detailed logging
- **Textlink Management**: Footer link management with domain targeting
- **Public APIs**: Read-only JSON APIs for external consumption
- **Role-Based Access Control**: Admin, Editor, and Viewer roles

### Key Capabilities

- 🔐 **Authentication**: Supabase Auth with role-based permissions
- 📊 **Analytics Dashboard**: Overview of content metrics and activity
- 🎮 **Game Asset Management**: File uploads to Supabase Storage
- ☁️ **Cloudflare Cache Control**: Multiple purge modes (URL, Hostname, Tag, Prefix)
- 🔗 **Smart Textlinks**: Domain-specific link placement
- 📱 **Responsive Design**: Modern UI with dark/light theme support
- 🚀 **Performance**: Optimized with Next.js 15 and Turbopack

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Radix UI** components
- **Lucide React** & **Tabler Icons**
- **React Hook Form** with **Zod** validation
- **TanStack Table** for data tables
- **Recharts** for analytics

### Backend

- **Supabase** (PostgreSQL, Auth, Storage)
- **Next.js API Routes** (serverless)
- **Row Level Security (RLS)** policies
- **Cloudflare API** integration

### Development

- **TypeScript** for type safety
- **ESLint** for code quality
- **Turbopack** for fast builds

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (admin)/                 # Admin route group
│   │   └── admin/               # Admin dashboard
│   │       ├── websites/        # Website management
│   │       ├── games/           # Game management
│   │       ├── cloudflare/     # Cloudflare management
│   │       ├── textlinks/      # Textlink management
│   │       └── api-docs/       # API documentation
│   ├── api/                     # API routes
│   │   ├── admin/              # Admin APIs (protected)
│   │   ├── games/             # Public game API
│   │   ├── websites/          # Public website API
│   │   └── public/            # Public APIs
│   └── auth/                   # Authentication pages
├── components/                  # React components
│   ├── layout/                 # Layout components
│   ├── ui/                     # Reusable UI components
│   ├── forms/                  # Form components
│   └── shared/                 # Shared components
├── hooks/                      # Custom React hooks
├── lib/                        # Utilities and configurations
│   ├── auth/                   # Authentication logic
│   ├── database/              # Supabase client setup
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
└── features/                   # Feature-specific modules
```

## 🗄️ Database Schema

### Core Tables

#### Websites

- **URL management** with unique constraints
- **SEO metrics**: traffic, domain rating, backlinks, referring domains
- **Categorization** and **featured content** flags
- **WordPress detection** and **GSA indexing** flags

#### Games

- **Game metadata**: title, description, category
- **Developer information** and **publish year**
- **Asset management**: icons, thumbnails, game files
- **Embed support** for iframe/HTML content

#### Cloudflare Accounts

- **Multi-account support** with API tokens
- **Account identification** and **email tracking**
- **Secure token storage** with RLS protection

#### Textlinks

- **Link management** with anchor text and attributes
- **Domain targeting** (specific websites or custom domains)
- **Path-based inclusion/exclusion** rules
- **Bulk placement** options

#### Purge Logs

- **Audit trail** for all cache purges
- **Multiple purge modes** (URL, hostname, tag, prefix)
- **Status tracking** and **result logging**

## 🔐 Authentication & Authorization

### User Roles

- **Admin**: Full system access, can manage accounts and logs
- **Editor**: Content management (create/edit), cannot delete critical data
- **Viewer**: Read-only access to all content

### Security Features

- **Row Level Security (RLS)** on all tables
- **JWT-based authentication** with role claims
- **API route protection** with middleware
- **Secure token storage** for Cloudflare accounts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd cms
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Configure authentication settings

4. **Environment Variables**
   Create `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Access the application**
   - Admin panel: `http://localhost:3000/admin`
   - Public APIs: `http://localhost:3000/api/`

## 📚 API Documentation

### Admin APIs (Protected)

#### Websites

- `GET /api/admin/websites` - List websites with filters
- `POST /api/admin/websites` - Create website
- `PUT /api/admin/websites/[id]` - Update website
- `DELETE /api/admin/websites/[id]` - Delete website

#### Games

- `GET /api/admin/games` - List games with filters
- `POST /api/admin/games` - Create game
- `PUT /api/admin/games/[id]` - Update game
- `DELETE /api/admin/games/[id]` - Delete game

#### Cloudflare

- `GET /api/admin/cloudflare/accounts` - List accounts
- `POST /api/admin/cloudflare/accounts` - Add account
- `POST /api/admin/cloudflare/purge` - Purge cache
- `GET /api/admin/cloudflare/purge-logs` - View purge history

### Public APIs (Read-only)

#### Games API

```bash
GET /api/games?category=puzzle&isFeatured=true&limit=20
```

#### Websites API

```bash
GET /api/websites?category=blog&minTraffic=1000&sort=domain_rating
```

#### Textlinks API

```bash
GET /api/public/backlinks?domain=example.com
```

## 🎨 UI Components

### Layout Components

- **AppSidebar**: Navigation with collapsible menu
- **SiteHeader**: Top navigation with user menu
- **Responsive design** with mobile support

### Data Management

- **DataTable**: Sortable, filterable tables with pagination
- **Form dialogs**: Modal forms for CRUD operations
- **File upload**: Drag-and-drop file handling
- **Bulk actions**: Multi-select operations

### Cloudflare Integration

- **Account management**: Add/edit Cloudflare accounts
- **Purge interface**: Select mode and configure purge options
- **Log viewer**: Track all purge operations
- **Zone selection**: Choose target zones for purging

## 🔧 Configuration

### Supabase Setup

1. Create project and get credentials
2. Run database schema
3. Configure authentication
4. Set up storage buckets
5. Configure RLS policies

### Cloudflare Integration

1. Create API tokens with cache purge permissions
2. Add accounts through admin interface
3. Configure zones for purging

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-only)

## 🚀 Deployment

### Vercel Deployment

1. Connect repository to Vercel
2. Set environment variables
3. Deploy with automatic builds

### Supabase Production

1. Update authentication URLs
2. Configure CORS for public APIs
3. Set up monitoring and logging

## 📊 Monitoring & Analytics

### Built-in Features

- **Activity tracking** with user attribution
- **Purge logging** with status monitoring
- **Error handling** with detailed logging
- **Performance metrics** in dashboard

### External Integrations

- **Sentry** support for error tracking
- **Supabase logs** for database monitoring
- **Vercel analytics** for performance insights

## 🔒 Security Considerations

### Data Protection

- **RLS policies** on all database tables
- **API token encryption** for Cloudflare accounts
- **Input validation** with Zod schemas
- **CORS configuration** for public endpoints

### Access Control

- **Role-based permissions** throughout the system
- **Middleware protection** for admin routes
- **Audit trails** for all operations
- **Secure file uploads** to Supabase Storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:

- Check the `SUPABASE_SETUP.md` for setup issues
- Review the `req.md` for detailed requirements
- Contact the development team

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies.**

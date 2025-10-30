# Prieelo - Technology Stack & Application Overview

## Application Summary

**Prieelo** is a social platform for DIY upcycling enthusiasts that follows the motto "Scrap to Snap" - transforming waste into wonderful creations. The platform enables users to document and share their transformation journey through a structured three-phase system: **Raw → Remaking → Reveal**.

### Core Concept
- **Raw (📦)**: Show the starting materials and waste items
- **Remaking (🔧)**: Document the transformation process and techniques  
- **Reveal (✨)**: Present the finished creation

## Technology Stack

### Frontend Framework
- **Next.js 14.2.28** - React-based full-stack framework with App Router
- **React 18.2.0** - Component-based UI library
- **TypeScript 5.2.2** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 3.3.3** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Framer Motion 10.18.0** - Animation library
- **Lucide React** - Icon library
- **Custom Brand Colors**: 
  - Prieelo Green: `#324426`
  - Prieelo Orange: `#ed4924` 
  - Prieelo Cream: `#f6f6d6`
  - Prieelo Blue: `#a1c0e5`

### Database & ORM
- **PostgreSQL** - Primary database
- **Prisma 6.7.0** - Database ORM and migration tool
- **@prisma/client** - Type-safe database client

### Authentication & Authorization
- **NextAuth.js 4.24.11** - Authentication library
- **bcryptjs** - Password hashing
- **JWT-based sessions** with custom user status validation
- **User approval system** with statuses: PENDING, APPROVED, REJECTED, SUSPENDED

### File Storage
- **AWS S3** - Image and file storage
- **@aws-sdk/client-s3** - AWS SDK for S3 operations
- **@aws-sdk/s3-request-presigner** - Signed URL generation for secure file access

### State Management & Data Fetching
- **@tanstack/react-query 5.0.0** - Server state management
- **SWR 2.2.4** - Data fetching with caching
- **Zustand 5.0.3** - Client-side state management
- **Jotai 2.6.0** - Atomic state management

### Form Handling & Validation
- **React Hook Form 7.53.0** - Form management
- **Zod 3.23.8** - Schema validation
- **Yup 1.3.0** - Alternative validation library
- **Formik 2.4.5** - Form library

### Internationalization
- **Multi-language support** with custom translation system
- **Supported languages**: English (en), Arabic (ar), Dutch (nl)
- **RTL support** for Arabic

### Additional Features
- **Charts & Analytics**: Chart.js, React-Chartjs-2, Plotly.js, Recharts
- **Image Processing**: React-image-crop for image cropping
- **Email**: Nodemailer for transactional emails
- **Date Handling**: date-fns, dayjs
- **UI Enhancements**: 
  - React-datepicker for date selection
  - Sonner for toast notifications
  - React-intersection-observer for lazy loading

## Application Architecture

### Database Schema
The application uses a relational database with the following key models:

- **Users**: Authentication, profiles, and approval status
- **Projects**: Main container for DIY transformations
- **ProjectPhases**: Individual posts within projects (Raw/Remaking/Reveal)
- **Comments**: User interactions on projects and phases
- **Likes**: Both project likes and post likes
- **ModerationActions**: Admin moderation tracking

### Authentication Flow
1. **Registration**: Users sign up and enter PENDING status
2. **Approval Process**: Admins review and approve/reject users
3. **Status-based Access**: Only APPROVED users can create content
4. **Session Management**: JWT-based with real-time status validation

### Project Workflow
1. **Project Creation**: Users create a project container
2. **Phase Progression**: Must follow Raw → Remaking → Reveal sequence
3. **Content Validation**: Each phase requires previous phases to be completed
4. **Public/Private**: Projects and phases can be made public or private

### File Management
- **S3 Integration**: All images stored in AWS S3 buckets
- **Signed URLs**: Secure access to private content
- **Image Processing**: Client-side cropping and optimization
- **Upload Validation**: File type and size restrictions

### Admin Features
- **User Management**: Approve/reject/suspend users
- **Content Moderation**: Review and moderate projects/posts
- **Analytics Dashboard**: User and content statistics
- **Bulk Operations**: Mass user management capabilities

### Internationalization
- **Translation System**: Custom i18n implementation
- **Language Switching**: Real-time language switching
- **RTL Support**: Proper Arabic text direction handling

## Development & Deployment

### Development Tools
- **ESLint** - Code linting with Next.js config
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Prisma Studio** - Database GUI

### Build & Deployment
- **Next.js Build System** - Optimized production builds
- **Environment Configuration** - Flexible deployment settings
- **Database Migrations** - Prisma-managed schema changes
- **Seed Scripts** - Database initialization and test data

### Key Configuration Files
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Styling configuration  
- `prisma/schema.prisma` - Database schema
- `middleware.ts` - Route protection and authentication
- `lib/auth-config.ts` - Authentication setup

## Unique Features

1. **Structured Storytelling**: Enforced three-phase narrative for complete project documentation
2. **Approval-based Community**: Curated user base through admin approval system
3. **Multi-language Support**: Global accessibility with RTL support
4. **Phase-based Progression**: Users must complete phases in order (Raw → Remaking → Reveal)
5. **Comprehensive Moderation**: Built-in tools for community management
6. **Crowdfunding Integration**: Pre-launch user acquisition system

## Security Features
- **Protected Routes**: Middleware-based route protection
- **Status Validation**: Real-time user status checking
- **Secure File Access**: S3 signed URLs for private content
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: React's built-in XSS prevention
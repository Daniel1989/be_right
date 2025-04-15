# Be Right

A modern task management application with internationalization (i18n) support and responsive layouts.

## Internationalization (i18n)

This project uses next-intl for internationalization support. The key features include:

- Locale-based routing with `/en` and `/zh` paths
- Language detection based on browser settings
- Easy language switching with a dropdown component
- Centralized translation files in the `messages` directory

### Translation Files

The translation files are stored in the `messages` directory, organized by locale:

```
messages/
  ├── en/
  │   └── common.json
  └── zh/
      └── common.json
```

### Adding a New Language

To add a new language:

1. Create a new folder in the `messages` directory with the locale code (e.g., `fr` for French)
2. Add a `common.json` file with the translated messages
3. Add the locale to the `locales` array in `middleware.ts`
4. Add the locale name to the `localeNames` object in `components/LanguageSwitcher.tsx`

## Responsive Layout

The application is built with responsiveness in mind using Tailwind CSS:

- Mobile-first approach with breakpoints for larger screens
- Responsive typography (text sizes adjust based on screen size)
- Flexible grid layout that adapts to different screen sizes
- Tailwind's utility classes are used for responsive design

### Responsive Breakpoints

The following breakpoints are defined:

- `xs`: 480px and above
- `sm`: 640px and above
- `md`: 768px and above
- `lg`: 1024px and above
- `xl`: 1280px and above
- `2xl`: 1536px and above

### Responsive Components

All components are designed to be responsive and will adjust their layout and styling based on the screen size.

## Development

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.


## bcrypt的问题

bcrypt 是一个原生依赖包，需要编译。如果你是在 CentOS 环境中，很可能缺少一些编译环境。

### 解决方案
1. npm rebuild bcrypt
2. 使用 bcryptjs替换

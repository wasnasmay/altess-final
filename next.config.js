/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }

    config.ignoreWarnings = [
      { module: /node_modules\/node-fetch\/lib\/index\.js/ },
      { module: /node_modules\/punycode/ },
      { file: /node_modules\/node-fetch\/lib\/index\.js/ },
      // Ignorer les warnings Stripe
      function ignoreStripeDependencyWarnings(warning) {
        return (
          warning.module &&
          warning.module.resource &&
          (warning.module.resource.includes('node_modules/stripe') ||
            warning.module.resource.includes('@stripe'))
        );
      },
      // Ignorer les warnings Supabase
      function ignoreSupabaseDependencyWarnings(warning) {
        return (
          warning.module &&
          warning.module.resource &&
          (warning.module.resource.includes('node_modules/@supabase') ||
            warning.module.resource.includes('node_modules/supabase') ||
            warning.module.resource.includes('@supabase/node-fetch') ||
            warning.module.resource.includes('@supabase/gotrue-js') ||
            warning.module.resource.includes('@supabase/realtime-js') ||
            warning.module.resource.includes('@supabase/storage-js') ||
            warning.module.resource.includes('@supabase/auth-js'))
        );
      },
      // Ignorer tous les warnings "Critical dependency"
      (warning) => {
        if (warning.message && typeof warning.message === 'string') {
          return (
            warning.message.includes('Critical dependency') ||
            warning.message.includes('the request of a dependency is an expression')
          );
        }
        return false;
      },
    ];

    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['stripe', '@supabase/supabase-js'],
  },
};

module.exports = nextConfig;

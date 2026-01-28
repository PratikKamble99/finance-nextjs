import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // experimental: {
  //   serverComponentsExternalPackages: ['@prisma/client'],
  // },
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     // Configure Web Workers
  //     config.module.rules.push({
  //       test: /\.worker\.(js|ts)$/,
  //       use: {
  //         loader: 'worker-loader',
  //         options: {
  //           name: 'static/[hash].worker.js',
  //           publicPath: '/_next/',
  //         },
  //       },
  //     })
  //   }
  //   return config
  // },
}

export default nextConfig
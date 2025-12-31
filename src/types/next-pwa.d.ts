declare module 'next-pwa' {
    import { NextConfig } from 'next';

    function withPWA(config: NextConfig): (phase: string, { defaultConfig }: any) => NextConfig;

    export default function withPWAInit(pwaConfig: {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        scope?: string;
        sw?: string;
        skipWaiting?: boolean;
        publicExcludes?: string[];
        buildExcludes?: any[];
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        addDirectoryIndex?: boolean;
        dynamicStartUrl?: boolean;
        dynamicStartUrlRedirect?: string;
        fallbacks?: any;
        cacheStartUrl?: boolean;
        redirects?: any;
        subdomainPrefix?: string;
    }): typeof withPWA;
}

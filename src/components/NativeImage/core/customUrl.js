// native-image:// 协议编解码（design.md §4.1）
// 形态：native-image://<kind>/<id>[/<sub>]/<resourceKey>?u=<base64url(url)>&k=<encryptKey>&v=<schemaVersion>

import { PROTOCOL, SCHEMA_VERSION } from './constants';

const base64UrlEncode = (str) => {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'utf8').toString('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    // renderer 环境
    const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(str))) : '';
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlDecode = (str) => {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(b64, 'base64').toString('utf8');
    }
    if (typeof atob === 'function') {
        return decodeURIComponent(escape(atob(b64)));
    }
    return '';
};

/**
 * 编码：把 (scope, resourceKey, url, encryptKey) 编成 native-image:// URL。
 * @param {{ scope, resourceKey, url, encryptKey? }} params
 * @returns {string}
 */
export const encode = ({ scope, resourceKey, url, encryptKey }) => {
    const subPart = scope.sub ? `/${encodeURIComponent(scope.sub)}` : '';
    const path = `${encodeURIComponent(scope.kind)}/${encodeURIComponent(scope.id)}${subPart}/${encodeURIComponent(resourceKey)}`;
    const qs = new URLSearchParams();
    qs.set('u', base64UrlEncode(url));
    if (encryptKey) qs.set('k', encryptKey);
    qs.set('v', String(SCHEMA_VERSION));
    return `${PROTOCOL}://${path}?${qs.toString()}`;
};

/**
 * 解码：从 native-image:// URL 还原出 (scope, resourceKey, url, encryptKey)。
 * @param {string} fullUrl
 * @returns {{ scope, resourceKey, url, encryptKey: string|null, schemaVersion: number } | null}
 */
export const decode = (fullUrl) => {
    if (!fullUrl || typeof fullUrl !== 'string') return null;
    if (!fullUrl.startsWith(`${PROTOCOL}://`)) return null;
    try {
        const rest = fullUrl.slice(PROTOCOL.length + 3); // strip 'native-image://'
        const [pathPart, queryPart = ''] = rest.split('?');
        const segs = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
        if (segs.length < 3) return null;

        let kind, id, sub, resourceKey;
        if (segs.length === 3) {
            [kind, id, resourceKey] = segs;
            sub = undefined;
        } else {
            [kind, id, sub, resourceKey] = segs;
        }

        const qs = new URLSearchParams(queryPart);
        const url = qs.has('u') ? base64UrlDecode(qs.get('u')) : '';
        const encryptKey = qs.get('k') || null;
        const schemaVersion = Number(qs.get('v') || SCHEMA_VERSION);

        return {
            scope: sub !== undefined ? { kind, id, sub } : { kind, id },
            resourceKey,
            url,
            encryptKey,
            schemaVersion,
        };
    } catch (_e) {
        return null;
    }
};

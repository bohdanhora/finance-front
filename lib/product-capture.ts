import { normalizeGoalUrl } from "./savings";

export type CapturedProduct = {
    url: string;
    title?: string;
    image?: string;
    price?: number;
    currency?: string;
};

export const CAPTURE_PARAM = "capture";

const BOOKMARKLET_SOURCE = String.raw`(function(){var d=document,m=function(s){var e=d.querySelector(s);return e?(e.getAttribute('content')||e.getAttribute('href')||e.getAttribute('src')||e.textContent||'').trim():''},p=null,w=function(n){if(p||!n||typeof n!='object')return;if(Array.isArray(n)){n.forEach(w);return}if(/\bProduct/.test([].concat(n['@type']).join(' '))){p=n;return}w(n['@graph']);w(n.mainEntity)};d.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){try{w(JSON.parse(s.textContent))}catch(e){}});var o=p?[].concat(p.offers||[])[0]||{}:{};if(o.offers&&!o.price)o=[].concat(o.offers)[0]||o;var i=p?[].concat(p.image||[])[0]:'';if(i&&typeof i=='object')i=i.url||i.contentUrl||'';var h=d.querySelector('h1'),t=h?h.textContent.replace(/\s+/g,' ').trim():'',r={url:location.href,title:(t&&d.title.toLowerCase().indexOf(t.toLowerCase())==0?t:'')||(p&&p.name)||t||m('meta[property="og:title"]')||d.title,image:i||m('meta[property="og:image"]')||m('[itemprop="image"]'),price:String(o.price||o.lowPrice||m('meta[property="product:price:amount"]')||m('[itemprop="price"]')||''),currency:o.priceCurrency||m('meta[property="product:price:currency"]')||m('[itemprop="priceCurrency"]')||''};try{r.image=r.image?new URL(r.image,location.href).href:''}catch(e){r.image=''}var u=ORIGIN+'/savings?${CAPTURE_PARAM}='+encodeURIComponent(JSON.stringify(r));if(!window.open(u,'_blank'))location.href=u})();`;

export const buildBookmarklet = (origin: string) =>
    `javascript:${BOOKMARKLET_SOURCE.replace("ORIGIN", JSON.stringify(origin))}`;

export const parseCapturedAmount = (raw: unknown): number | undefined => {
    if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : undefined;
    if (typeof raw !== "string") return undefined;

    const digits = raw.replace(/[^\d.,]/g, "");
    if (!digits) return undefined;

    const decimal = /[.,](\d{1,2})$/.exec(digits);
    const whole = decimal ? digits.slice(0, digits.length - decimal[1].length - 1) : digits;
    const value = Number(`${whole.replace(/\D/g, "")}${decimal ? `.${decimal[1]}` : ""}`);

    return Number.isFinite(value) && value > 0 ? value : undefined;
};

const text = (value: unknown, limit: number) =>
    typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim().slice(0, limit) : undefined;

const httpsImage = (value: unknown) => {
    const raw = text(value, 2000);
    if (!raw) return undefined;

    try {
        const url = new URL(raw);
        if (url.protocol === "http:") url.protocol = "https:";
        return url.protocol === "https:" ? url.href : undefined;
    } catch {
        return undefined;
    }
};

export const parseCapture = (raw: string | null): CapturedProduct | null => {
    if (!raw) return null;

    let data: Record<string, unknown>;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        data = parsed as Record<string, unknown>;
    } catch {
        return null;
    }

    const url = typeof data.url === "string" ? normalizeGoalUrl(data.url) : null;
    if (!url) return null;

    const price = parseCapturedAmount(data.price);
    const currency = text(data.currency, 8)?.toUpperCase();

    return {
        url,
        title: text(data.title, 200),
        image: httpsImage(data.image),
        price,
        currency: price !== undefined && currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined,
    };
};

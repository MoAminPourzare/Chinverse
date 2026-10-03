import { describe, expect, it } from 'vitest';
import { collectBetaClientMetadata } from './beta.service';

describe('beta feedback client metadata', () => {
    it('collects only coarse diagnostics and never account identifiers', () => {
        const metadata = collectBetaClientMetadata();
        expect(metadata).toBeDefined();
        expect(Object.keys(metadata || {}).sort()).toEqual([
            'browser',
            'locale',
            'network',
            'os',
            'platform',
            'screen_height',
            'screen_width',
            'standalone',
            'timezone',
        ]);
        expect(metadata).not.toHaveProperty('email');
        expect(metadata).not.toHaveProperty('user_id');
        expect(metadata).not.toHaveProperty('token');
    });
});

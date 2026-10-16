/* Cookie choice (16 Oct 2026). Google Analytics is the only optional technology on the site; it runs only
   after the visitor chooses "Allow analytics". Uses vanilla-cookieconsent 3.0.1 (loaded just before this
   file). Analytics tags in each page are written as <script type="text/plain" data-category="analytics">,
   which the library switches on after consent; withdrawing consent deletes the _ga cookies and reloads.
   Any element with data-cc="show-preferencesModal" (the footer's "Cookie settings") reopens the choice.
   Maps and videos are handled separately: they load only when the visitor asks (js/map-consent.js,
   YouTube's privacy-enhanced mode in js/youtube.js). Wording and cookie list match privacy.html#cookies. */
(() => {
    'use strict';
    if (!window.CookieConsent) return;

    window.CookieConsent.run({
        revision: 1,
        hideFromBots: false,
        cookie: { name: 'gmt_cookie_choice', expiresAfterDays: 182 },
        guiOptions: {
            consentModal: { layout: 'bar inline', position: 'bottom', equalWeightButtons: true, flipButtons: false },
            preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false },
        },
        categories: {
            necessary: { enabled: true, readOnly: true },
            analytics: {
                autoClear: { cookies: [{ name: /^_ga/ }], reloadPage: true },
            },
        },
        language: {
            default: 'en',
            translations: {
                en: {
                    consentModal: {
                        title: 'Can we count your visit?',
                        description: 'We’d like to use Google Analytics cookies to see how the website is used, so we can improve it. They are only set if you allow them. <a href="privacy.html#cookies">How we use cookies</a>',
                        acceptAllBtn: 'Allow analytics',
                        acceptNecessaryBtn: 'No thanks',
                    },
                    preferencesModal: {
                        title: 'Cookie settings',
                        acceptAllBtn: 'Allow analytics',
                        acceptNecessaryBtn: 'No thanks',
                        savePreferencesBtn: 'Save my choice',
                        closeIconLabel: 'Close',
                        sections: [
                            { description: 'Choose whether we may use analytics cookies. You can change your mind at any time with “Cookie settings” at the foot of each page.' },
                            {
                                title: 'Strictly necessary',
                                description: 'One cookie remembers the choice you make here, for six months. It is always on.',
                                linkedCategory: 'necessary',
                            },
                            {
                                title: 'Analytics (Google Analytics)',
                                description: 'Counts visits and the pages people view, so we can see what is useful. Google processes this for us, with its advertising features turned off. Off unless you allow it.',
                                linkedCategory: 'analytics',
                                cookieTable: {
                                    headers: { name: 'Cookie', duration: 'Kept for' },
                                    body: [
                                        { name: '_ga', duration: '2 years' },
                                        { name: '_ga_…', duration: '2 years' },
                                    ],
                                },
                            },
                            {
                                title: 'Maps and videos',
                                description: 'Google Maps and YouTube load only when you press “Show map” or play a video. Google may then set its own cookies.',
                            },
                            { description: 'More in our <a href="privacy.html">privacy policy</a>.' },
                        ],
                    },
                },
            },
        },
    });
})();

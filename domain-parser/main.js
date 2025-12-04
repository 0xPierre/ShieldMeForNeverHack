class DomainParser {

    static isOnlyAscii(text) {
        return text.match(/[^\x00-\x7F]/g) === null;
    }
}

/////////////////////////////////// TEST CASES /////////////////////

// valid: true  → contains ONLY ASCII characters
// valid: false → contains ANY non-ASCII character

const testDomains = [
    // --- Basic ASCII domains ---
    { value: "http://example.com", valid: true },
    { value: "https://google.com", valid: true },
    { value: "http://sub.domain.org", valid: true },
    { value: "https://my-site.net", valid: true },
    { value: "www.qwant.com", valid: true },
    { value: "test.io", valid: true },
    { value: "sample.co.uk", valid: true },
    { value: "portal.company.tech", valid: true },
    { value: "support.helpdesk.info", valid: true },

    // --- Mixed protocols / no protocol ---
    { value: "ftp://files.server.net", valid: true },
    { value: "mailto:contact@example.com", valid: true },
    { value: "www.testsite.biz", valid: true },
    { value: "noscheme-domain.com", valid: true },
    { value: "domain-with-dashes-example.com", valid: true },

    // --- Unicode / International (IDN) ---
    { value: "https://www.Привет.fr", valid: false },
    { value: "http://müller.de", valid: false },
    { value: "http://τακτική.gr", valid: false },
    { value: "https://日本語.jp", valid: false },
    { value: "http://中国.cn", valid: false },
    { value: "https://españa.es", valid: false },
    { value: "http://пример.рф", valid: false },
    { value: "http:// الصفحة-الرئيسية.com", valid: false },
    { value: "http://한글.kr", valid: false },
    { value: "https://مرحبا.net", valid: false },
    { value: "https://😊.ws", valid: false },

    // Punycode-looking entries but still ASCII → VALID
    { value: "http://xn--fsq.com", valid: true },
    { value: "http://xn--bcher-kva.de", valid: true },

    // --- Subdomain stress tests ---
    { value: "https://a.b.c.d.e.f.g.example.com", valid: true },
    { value: "https://123.abc.456.xyz.domain.net", valid: true },
    { value: "http://very.long.subdomain.chain.testing.example.org", valid: true },

    // --- With ports ---
    { value: "http://localhost:3000", valid: true },
    { value: "http://example.com:8080", valid: true },
    { value: "https://api.server.net:443", valid: true },
    { value: "http://192.168.0.1:8081", valid: true },

    // --- IP-based URLs ---
    { value: "http://127.0.0.1", valid: true },
    { value: "https://8.8.8.8", valid: true },
    { value: "ftp://10.0.0.1", valid: true },
    { value: "http://255.255.255.255", valid: true },

    // --- URLs with paths ---
    { value: "https://example.com/login", valid: true },
    { value: "http://site.org/user/profile?id=42", valid: true },
    { value: "https://blog.net/post/2025/awesome", valid: true },
    { value: "http://download.server.com/files/setup.exe", valid: true },

    // --- URLs with query & fragment ---
    { value: "https://domain.com/search?q=test", valid: true },
    { value: "http://example.org/home#section2", valid: true },
    { value: "https://shop.com/product?ref=123&utm=abc", valid: true },
    { value: "http://api.site.com/v1/users?page=3&limit=10", valid: true },

    // --- Local & internal ---
    { value: "localhost", valid: true },
    { value: "intranet.local", valid: true },
    { value: "printer.office.lan", valid: true },
    { value: "router.home", valid: true },
    { value: "dev.env", valid: true },

    // --- Edge cases ---
    { value: "http://-invalid-start.com", valid: true },
    { value: "http://invalid-end-.com", valid: true },
    { value: "http://double..dot.com", valid: true },
    { value: "https://.starts-with-dot.com", valid: true },
    { value: "https://ends-with-dot.com.", valid: true },
    { value: "not_a_domain", valid: true },
    { value: "just_text", valid: true },
    { value: "", valid: true },  // empty → no non-ASCII
    { value: "    ", valid: true }, // spaces are ASCII

    // --- TLD variety ---
    { value: "https://cool.website", valid: true },
    { value: "http://random.xyz", valid: true },
    { value: "https://project.dev", valid: true },
    { value: "http://company.solutions", valid: true },
    { value: "https://node.tools", valid: true },
    { value: "http://portal.education", valid: true },
    { value: "https://brand.store", valid: true },
    { value: "http://cloud.services", valid: true },

    // --- More weird Unicode domains ---
    { value: "http://💻.tech", valid: false },
    { value: "http://🔧🔨.tools", valid: false },
    { value: "https://градус.сайт", valid: false },
    { value: "https://компания.онлайн", valid: false },
    { value: "http://例子.测试", valid: false },
    { value: "http://مثال.إختبار", valid: false },
    { value: "http://täst.ch", valid: false },
    { value: "https://föø-bar.de", valid: false },
];



let passed = 0;
let failed = 0;

testDomains.forEach(({ value, valid }) => {
    const result = DomainParser.isOnlyAscii(value);

    if (result === valid) {
        passed++;
    } else {
        failed++;
        console.error(`FAIL: ${value} → expected ${valid}, got ${result}`);
    }
});

console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${testDomains.length}`);

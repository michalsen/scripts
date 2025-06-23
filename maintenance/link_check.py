import scrapy
from scrapy.linkextractors import LinkExtractor
from scrapy.spiders import CrawlSpider, Rule
from urllib.parse import urljoin

class RedirectCheckerSpider(CrawlSpider):
    name = 'redirect_checker'

    def __init__(self, domain=None, *args, **kwargs):
        super(RedirectCheckerSpider, self).__init__(*args, **kwargs)
        self.allowed_domains = [domain] if domain else ['example.com']
        self.start_urls = [f'http://{domain}'] if domain else ['http://example.com']
        self.redirects = []
        self.not_found = []

        # Custom settings for the spider
        self.custom_settings = {
            'ROBOTSTXT_OBEY': True,
            'HTTPCACHE_ENABLED': False,
            'CONCURRENT_REQUESTS': 16,
            'DOWNLOAD_DELAY': 0.5,
            'USER_AGENT': 'Mozilla/5.0 (compatible; RedirectCheckerBot/1.0; +https://kidney.org/bot)',
        }

    rules = (
        Rule(LinkExtractor(allow=(), deny=(
            # Add patterns to deny (e.g., logout links, file downloads)
            r'logout',
            r'\.pdf$',
            r'\.zip$',
            r'\.jpg$',
            r'\.png$',
            r'\.gif$',
        )), callback='parse_response', follow=True),
    )

    def parse_response(self, response):
        # Check response status and categorize
        if response.status == 404:
            self.not_found.append({
                'url': response.url,
                'referer': response.request.headers.get('Referer', b'').decode('utf-8'),
                'status': response.status,
            })
        elif response.status in (301, 302):
            redirect_url = response.headers.get('Location', b'').decode('utf-8')
            absolute_redirect = urljoin(response.url, redirect_url)

            self.redirects.append({
                'from': response.url,
                'to': absolute_redirect,
                'status': response.status,
                'referer': response.request.headers.get('Referer', b'').decode('utf-8'),
            })

    def closed(self, reason):
        # Print summary when spider finishes
        print("\n\n=== Redirect Summary ===")
        for redirect in self.redirects:
            print(f"[{redirect['status']}] {redirect['from']} → {redirect['to']} (Referer: {redirect['referer']})")

        print("\n\n=== 404 Not Found Summary ===")
        for not_found in self.not_found:
            print(f"[404] {not_found['url']} (Referer: {not_found['referer']})")

        print(f"\nTotal redirects found: {len(self.redirects)}")
        print(f"Total 404s found: {len(self.not_found)}")


# To run this spider from a script rather than command line
if __name__ == "__main__":
    from scrapy.crawler import CrawlerProcess

    # Prompt user for domain or use default
    domain = input("Enter domain to scan (without http://): ") or "example.com"

    process = CrawlerProcess()
    process.crawl(RedirectCheckerSpider, domain=domain)
    process.start()

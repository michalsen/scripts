describe("pdfs", () => {

  const baseUrl = Cypress.env('BASE_URL');
  const downloadFolder = 'cypress/downloads';

  it("Confirm PDF Links on home page", () => {

    cy.visit(baseUrl);

    cy.get('a[href]').then(($links) => {
      const pdfLinks = []

      $links.each((index, link) => {
        const href = link.href
        if (href.match(/\.pdf$/i)) {
          const filename = href.split('/').pop().split('?')[0]
          pdfLinks.push({
            text: link.innerText.trim(),
            url: href,
            filename: filename,
            element: Cypress.$(link)
          })
        }
      })

      cy.task('log', `Found ${pdfLinks.length} PDF links:`)
      pdfLinks.forEach((pdf, i) => {
        cy.task('log', `#${i + 1}: ${pdf.filename} => ${pdf.url}`)  // Now printing just the filename
        cy.task('downloadFile', { url: `${pdf.url}`, filename: `${pdf.filename}` }).then((result) => {
          cy.task('fileExists', `${downloadFolder}/${pdf.filename}`).should('be.true');
        })

        cy.wrap(pdfLinks).as('pdfLinks')
      })
    });
  });
});

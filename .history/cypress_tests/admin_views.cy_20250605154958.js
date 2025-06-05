describe('As Admin User, checking pages', () => {

  const username = Cypress.env('USERNAME');
  const password = Cypress.env('PASSWORD');
  const baseUrl = Cypress.env('BASE_URL');

  const loginUrl = '/user/login';
  const homePageUrl = '/home';
  const calendarPageUrl = '/events';
  const staffPageUrl = '/staff';
  const groupsPageUrl = '/groups';
  const officesPageUrl = '/offices';
  const homeofficePageUrl = '/node/85';
  const searchUrl = '/search-content';
  const group230Url = '/group/230';
  const checkfeedUrl = '/feed/1';
  const groupId = 7024; // Website Group ID

  // Get the current month and year
  const currentDate = new Date();
  const options = { month: 'long', year: 'numeric' }; // e.g., "January 2025"
  const CURRENT_MONTH_YEAR = currentDate.toLocaleString('default', options);

  beforeEach(() => {
    // Check if cookies are already set to determine if the user is logged in
    cy.getCookies().then(cookies => {
      if (cookies.length === 0) {
        // If no cookies are found, perform the login
        cy.visit(baseUrl + loginUrl);
        cy.get('input[name="name"]').type(username);
        cy.get('input[name="pass"]').type(password);
        cy.get('button[name="op"]').click();
      }
    });
  });

  it('should check the home page for Quick Resources', () => {

    // Check that Quick Resources title is present
    cy.visit(baseUrl + homePageUrl);
    cy.contains('Quick Resources'); // Example: Checking if a welcome message is present
    it('Display row icons and column icons', () => {
      // Do the icons show on the home page?
      const rowIconSelector = '.row-icon';
      const columnIconSelector = '.column-icon';

      // Check if row icons are visible
      cy.get(rowIconSelector).should('be.visible');

      // Check if column icons are visible
      cy.get(columnIconSelector).should('be.visible');

      cy.log('Row icons and column icons are displayed.');
    });


  });

  // Ensure Calendar shows current month and year
  it('Verify the calendar shows current month and year', () => {
    cy.visit(baseUrl + calendarPageUrl);
    cy.contains(CURRENT_MONTH_YEAR).should('be.visible');
  });


  it('Verify that the first row has a title and an image', () => {
    cy.visit(baseUrl + staffPageUrl);

    // Get the first row
    cy.get('.views-row').first().then(($row) => {
      // Check if the row has title content
      cy.wrap($row).find('.title-content').should('not.be.empty');

      // Check if the row contains an image
      cy.wrap($row).find('.picture img').should('be.visible');
    });

    cy.log('First row has titles and images.');
  });

  it('Verify that there are more than 10 list items in the Other Groups section', () => {
    cy.visit(baseUrl + groupsPageUrl);

    // Locate the list-group and count the <li> items within it
    cy.get('.block-user-non-groups-block .list-group li.list-group-item')
      .should('have.length.greaterThan', 10); // Check that the count is greater than 10
    cy.log('Verified that there are more than 10 list items in the Other Groups section.');

    // Check if the Your Group section contains the text "Web Services"
    cy.get('.block-user-groups-block .list-group-item')
      .should('contain.text', 'Web Services');
    cy.log('Verified that the Your Group section contains "Web Services".');
  });

  it('Verify that there are more than 10 list items in the Offices page', () => {
    cy.visit(baseUrl + officesPageUrl);

    // Get the nodes and check the count is greater than 10
    cy.get('.view-content .views-row')
      .should('have.length.greaterThan', 10);

    cy.log('Verified that there are more than 10 nodes in the list.');
  });

  // Map with home office
  it('Verify that there is a map with the home office', () => {
    cy.visit(baseUrl + homeofficePageUrl);

    // Optional: Check if they are visible
    cy.get('#leaflet-map-view-all-offices-details-block-2 .leaflet-layer img.leaflet-tile')
      .each(($img) => {
        cy.wrap($img).should('be.visible'); // Assert that each tile is visible
      });

    cy.log('Verified that there are more than 10 map images present.');
  });

  // Search for "Brand guide"
  it('Searches for "Brand guide"', () => {
    // Visit the search page
    cy.visit(baseUrl + searchUrl);

    // Enter "Brand guide" into the search field
    cy.get('#edit-search')
      .should('be.visible')
      .type('Brand guide');

    // Click the submit button
    cy.get('#edit-submit-search-content')
      .should('be.visible')
      .click();

    // Get the nodes and check the count is greater than 10
    cy.get('.view-content .row')
      .should('have.length.greaterThan', 10, { timeout: 5000 });

    cy.log('Verified that there are more than 10 nodes in the search result.');
  });

  // it('Verify People & Culture Team', () => {
  //     cy.visit(baseUrl + group230Url);

  //     // Verify content
  //     cy.contains('Organization & Communication').should('exist');
  //     cy.log('Organization & Communication exists.');

  //     // Various PDF's
  //     cy.get('.view-display-id-block_1').should('exist');
  //     // Check for <a> tags inside the block with href ending in .pdf
  //     cy.get('.view-display-id-block_1 a[href$=".pdf"]')
  //         .should('have.length.greaterThan', 0) // At least 1 PDF link
  //         .each(($link) => {
  //             // Verify each link is valid (optional)
  //             expect($link.attr('href')).to.include('.pdf');
  //             cy.wrap($link).should('have.attr', 'href').and('match', /\.pdf$/i);
  //         });
  // });

  // Check feed import
  it('Check feed import time', () => {
    cy.visit(baseUrl + checkfeedUrl);

    cy.contains('Source https://www.kidney.org/feed/events/csv')
      .parent() // or .siblings() depending on HTML structure
      .invoke('text')
      .then((fullText) => {
        // Enhanced regex to match hours, minutes, or seconds
        const timeRegex = /(\d+)\s*(hours?|minutes?|seconds?)/i;
        const match = fullText.match(timeRegex);

        if (!match) {
          throw new Error(`
                  Time text format is incorrect!
                  Actual text found: "${fullText}"
                  Expected formats: "X hour(s)", "X minute(s)", or "X second(s)"
              `);
        }

      });
  });

  it("Add node to group", () => {

    // 1. Add node to group
    cy.visit(`${baseUrl}/group/${groupId}/content/create/group_node%3Ablog_entry`);
    cy.get("#edit-title-0-value").type("Test Node Add", { delay: 0 });
    cy.window().then(win => {
      if (win.Drupal && win.Drupal.CKEditor5Instances) {
        // Iterate over each CKEditor instance
        win.Drupal.CKEditor5Instances.forEach(editor => {
          // Check if the source element contains the specific ID
          if (editor.sourceElement && editor.sourceElement.id === "edit-body-0-value") {
            // Set data for the specific CKEditor instance
            editor.setData('<p>Test</p>');
          }
        });
      } else {
        throw new Error('Drupal or CKEditor5Instances is not available on the window object.');
      }
    });
    cy.get('[data-drupal-selector="edit-submit"]').click();

    // 2. Extract the NID from the link within the message
    cy.url().then((url) => {
      cy.log('Current URL is: ' + url);
      const nid = url.split('/node/')[1].split('/')[0]
      // Store the nid for later tests
      Cypress.env('NodeId', nid);

      // Log and verify
      cy.log(`Extracted user NodeID: ${nid}`);
      expect(nid).to.match(/^\d+$/, 'nid should be numeric');

      // 3. Extract the NID from the link
      cy.visit(`${baseUrl}/group/${groupId}`);
      cy.get("#blogsAccordion > div:nth-of-type(1) a:nth-of-type(2)").contains('Test Node Add');

      cy.visit(`${baseUrl}/node/${nid}/delete?destination=/group/${groupId}/nodes`);
      cy.get('#edit-submit').click();

    })
  });

});

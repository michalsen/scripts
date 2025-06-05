describe('As Admin User, checking pages', () => {
  const username = Cypress.env('USERNAME');
  const password = Cypress.env('PASSWORD');
  const baseUrl = Cypress.env('BASE_URL');
  const loginUrl = '/user/login';
  const fakeuser = "CypressTest" + Math.floor(Math.random() * 1000);
  const fakepassword = 'CypressTest123!';
  const testEmail = `${fakeuser}@kidney.org`;
  const groupId = 7024; // Website Group ID

  // URL's with PDF links
  const deniedUrls = [
    '/node/776',
    '/node/7267',
    '/node/7561'
  ];

  // Confirmed Access Denied URLs
  const accessUrls = [
    '/node/443',
    '/node/5544',
    '/node/357'
  ];

  it("Create User", () => {

    // 1. Login as admin
    cy.visit(baseUrl + loginUrl);
    cy.get('input[name="name"]').type(username);
    cy.get('input[name="pass"]').type(password);
    cy.get('button[name="op"]').click();
    cy.visit(`${baseUrl}/admin/people/create`);

    // 2. Create a new user
    cy.get("#edit-mail").type(testEmail, { delay: 0 });
    cy.get("#edit-name").type(fakeuser, { delay: 0 });
    cy.get('#edit-pass-pass1').type(fakepassword, { delay: 0 });
    cy.get('#edit-pass-pass2').type(fakepassword, { delay: 0 });
    cy.get('[id="edit-roles"] [type="checkbox"]').check("staff");
    cy.get('[data-drupal-selector="edit-submit"]').click();

    // 3. Extract the UID from the link within the message
    cy.get('.messages__content').contains('Created a new user account for').within(() => {
      cy.get('a') // Find the link within the message
        .should('have.attr', 'href')
        .then((href) => {
          // Extract just the numeric UID (handles URLs with or without query parameters)
          const uid = href.match(/user\/(\d+)/)[1];

          // Store the UID for later tests
          Cypress.env('userId', uid);

          // Log and verify
          cy.log(`Extracted user ID: ${uid}`);
          expect(uid).to.match(/^\d+$/, 'UID should be numeric');

        });
    });

    // 4. Add member to group
    cy.visit(`${baseUrl}/group/${groupId}/members`);
    cy.contains('a', 'Add member', { timeout: 10000 }).click();
    cy.url().should('include', `/group/${groupId}/content/add/group_membership`);
    cy.get('#edit-entity-id-0-target-id').type(fakeuser);
    cy.get('.ui-autocomplete li', { timeout: 5000 }).first().click();
    cy.get('#edit-submit').click();

  });

  // Verify New User Access
  it("tests Cypress User", () => {

    // 1. Login as new user
    cy.visit(baseUrl + loginUrl);
    cy.get('input[name="name"]').type(fakeuser);
    cy.get('input[name="pass"]').type(fakepassword);
    cy.get('button[name="op"]').click();

    // 2. Check access to pages
    it('Checking URL Access', () => {
      accessUrls.forEach((url, index) => {
        cy.visit(baseUrl + url);
        checkPdfLinks();
      });
    });

    // 3. Check denied URL access
    deniedUrls.forEach((url, index) => {
      it(`checks for 403 on denied${index + 1}Url`, () => {
        cy.request({
          url: baseUrl + url,
          followRedirect: false,
          failOnStatusCode: false
        }).then((resp) => {
          expect(resp.status).to.eq(403);
        });
      });
    });
  });


  // Cleanup and remove test user
  it("Removes Cypress User", () => {

    const uid = Cypress.env('userId');

    // 1. Login as admin
    cy.visit(baseUrl + loginUrl);
    cy.get('input[name="name"]').type(username);
    cy.get('input[name="pass"]').type(password);
    cy.get('button[name="op"]').click();

    // 2. Remove user from group
    cy.visit(baseUrl + `/group/${groupId}/members`);
    cy.contains('tr', fakeuser)
      .find('.dropbutton-toggle button')
      .click()
      .parent()
      .siblings('.delete-group-relationship')
      .click();

    // 3. Verify the delete confirmation page loads
    cy.url().should('include', '/delete?destination=');

    // 4. Click the "Delete" button (submit form)
    cy.get('#edit-submit')
      .should('be.visible')
      .and('have.value', 'Delete')  // Optional: Ensure it's the Delete button
      .click();

    // 5. Verify redirected back to the members page
    cy.url().should('include', '/group/7024/members');

    // 6. Optional: Verify user is no longer listed
    cy.contains(fakeuser).should('not.exist');

    // 7. Remove user
    cy.visit(baseUrl + `/user/${uid}/cancel`);
    cy.get('#edit-user-cancel-method-user-cancel-delete')
      .should('exist')
      .check()  // This checks the radio button
      .should('be.checked');
    cy.get('#edit-submit').click();

  });

  // Add node to group
  it("Add node to group", () => {

    // 1. Login as admin
    cy.visit(baseUrl + loginUrl);
    cy.get('input[name="name"]').type(username);
    cy.get('input[name="pass"]').type(password);
    cy.get('button[name="op"]').click();

    // 2. Add node to group
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

    // 3. Extract the NID from the link within the message
    cy.url().then((url) => {
      cy.log('Current URL is: ' + url);
      const nid = url.split('/node/')[1].split('/')[0]
      // Store the nid for later tests
      Cypress.env('NodeId', nid);

      // Log and verify
      cy.log(`Extracted user NodeID: ${nid}`);
      expect(nid).to.match(/^\d+$/, 'nid should be numeric');
    })

    cy.pause(5000);

    // 4. Extract the NID from the link
    cy.visit(`${baseUrl}/group/${groupId}`);
    cy.get("#blogsAccordion > div:nth-of-type(1) a:nth-of-type(2)").contains('Test Node Add');

  });

});

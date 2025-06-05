describe('As admin user, create test users', () => {

  const username = Cypress.env('USERNAME');
  const password = Cypress.env('PASSWORD');
  const baseUrl = Cypress.env('BASE_URL');

  const loginUrl = '/research-connect/login';

  // User Roles
  // edit-roles-rconx-
  const userRoles = [
    'patient',
    'researcher',
    'admin'
  ];

  // Create Users
  it('Create test users', () => {

    // 1. Login as admin
    cy.visit(baseUrl + loginUrl);
    cy.get('form#user-login-form input[name="name"]').type(username);
    cy.get('form#user-login-form input[name="pass"]').type(password);
    cy.get('form#user-login-form [data-drupal-selector="edit-submit"]').click();
    // cy.pause(2000);

    // 2. Create a new user
    userRoles.forEach((role) => {
      cy.visit(`${baseUrl}/admin/people/create`);
      cy.get("#edit-mail").type('cypress_' + role + '@kidney.org', { delay: 0 });
      cy.get("#edit-name").type('cypress_' + role, { delay: 0 });
      cy.get('#edit-pass-pass1').type('cypress_' + role, { delay: 0 });
      cy.get('#edit-pass-pass2').type('cypress_' + role, { delay: 0 });
      cy.get('[id="edit-roles"] [type="checkbox"]').check('rconx_' + role);
      cy.get('[data-drupal-selector="edit-submit"]').click();

      // 3. Extract the UID from the link within the message
      cy.get('.messages__content').contains('Created a new user account for').within(() => {
        cy.get('a') // Find the link within the message
          .should('have.attr', 'href')
          .then((href) => {
            // Extract just the numeric UID (handles URLs with or without query parameters)
            const uid = href.match(/user\/(\d+)/)[1];

            // Store the UID for later tests
            Cypress.env('userId_' + role, uid);

            // Log and verify
            cy.log(`Extracted user ID: ${uid}`);
            expect(uid).to.match(/^\d+$/, 'UID should be numeric');
          });
      });
    });
  });

  // Test Patient Access
  it("Test Patient Access", () => {

    cy.visit(baseUrl + loginUrl);
    cy.get('form#user-login-form input[name="name"]').type('cypress_patient');
    cy.get('form#user-login-form input[name="pass"]').type('cypress_patient');
    cy.get('form#user-login-form [data-drupal-selector="edit-submit"]').click();

    // cy.title().should('eq', 'Profile Information');

    cy.get('#edit-field-first-name-0-value')
      .type('Cypress')

    cy.get('#edit-field-last-name-0-value')
      .type('Patient')

    cy.get('#edit-field-phone-0-value')
      .type('502-555-1212')

    // Fill out address information
    cy.get('#edit-field-address-0-address-organization')
      .type('Test')

    cy.get('#edit-field-address-0-address-address-line1')
      .type('1187 Huntervaser')

    cy.get('#edit-field-address-0-address-locality')
      .type('Los Angeles')

    cy.get('#edit-field-address-0-address-administrative-area')
      .select('CA')

    cy.get('#edit-field-address-0-address-postal-code')
      .type('90211')

    // Fill out personal information
    cy.get('#edit-field-gender')
      .select('Male')

    cy.get('#edit-field-date-of-birth-0-value-date')
      .type('1970-01-01')

    // Select demographic information
    cy.contains('label', 'White or Caucasian').click()
    cy.contains('label', 'Advanced Degree').click()

    // Fill out kidney disease information
    cy.get('#edit-field-rconx-patient-type')
      .select('patient')

    cy.get('#edit-field-rconx-ckd-status')
      .select('ckd_1_2')

    cy.get('#edit-field-patient-ckd-cause')
      .select('acute_kidney_injury')

    // Select treatment history
    cy.contains('label', 'Peritoneal dialysis').click()
    cy.contains('label', 'High blood pressure').click()
    cy.contains('label', 'Liver disease').click()

    // Fill out donation information
    cy.get('#edit-field-rconx-living-donation-type')
      .select('directed')

    // Fill out research preferences
    cy.contains('label', 'Research panel/advisory').click()
    cy.contains('label', 'Weekdays').click()
    cy.contains('label', 'Willing to travel').click()

    // Add research description
    cy.get('#edit-field-rconx-other-research-0-value')
      .type('Description')

    // Save the profile
    cy.get('#edit-submit').click()

    // Verify navigation after save
    const puid = Cypress.env('userId_patient');
    cy.log('Extracted UID:', puid);
    cy.url().should('include', `/user/${puid}`)
    cy.title().should('eq', 'cypress_patient | Kidney Research Connect')
  });

  // Test Researcher Access
  it("Test Researcher Access", () => {
    cy.visit(baseUrl + loginUrl);
    cy.get('form#user-login-form input[name="name"]').type('cypress_researcher');
    cy.get('form#user-login-form input[name="pass"]').type('cypress_researcher');
    cy.get('form#user-login-form [data-drupal-selector="edit-submit"]').click();

    const ruid = Cypress.env('userId_researcher');
    cy.log('Extracted UID:', ruid);
    cy.visit(baseUrl + `/user/${ruid}/profile`);

    cy.get("#edit-field-first-name-0-value").type("cypress");
    cy.get("#edit-field-last-name-0-value").type("researcher");
    cy.get("#edit-field-professional-credentials-0-value").type("md");
    cy.get("#edit-field-phone-0-value").type("555-1212");
    cy.get("#edit-field-address-0-address-organization").type("research u.");
    cy.get("#edit-field-address-0-address-address-line1").type("123 Main St.");
    cy.get("#edit-field-address-0-address-locality").click();
    cy.get("#edit-field-address-0-address-locality").type("Chicago");
    cy.get("#edit-field-address-0-address-administrative-area").select("IL");
    cy.get("#edit-field-address-0-address-postal-code").type("60101");
    cy.get("#edit-field-professional-category").type("Resident");
    cy.get("div.js-form-item-field-professional-subspecialty-ckd > label").click();


    cy.get("#edit-submit").click();
    cy.wait(10000);

    cy.visit(baseUrl + `/user/${ruid}/profile`);
    cy.wait(10000);
  });


  // Cleanup and remove test users
  it("Removes Cypress users", () => {
    // 1. Login as admin
    cy.visit(baseUrl + loginUrl);
    cy.get('form#user-login-form input[name="name"]').type(username);
    cy.get('form#user-login-form input[name="pass"]').type(password);
    cy.get('form#user-login-form [data-drupal-selector="edit-submit"]').click();

    // Each rol
    userRoles.forEach((role) => {
      const uid = Cypress.env('userId_' + role);

      cy.log(`Removing user with UID: ${uid}`);
      cy.pause(2000);

      // 2. Remove user
      cy.visit(baseUrl + `/user/${uid}/cancel`);
      cy.get('#edit-user-cancel-method-user-cancel-delete')
        .should('exist')
        .check({ force: true })  // This checks the radio button
        .should('be.checked');
      cy.get('#edit-submit').click();
    });
  });


});

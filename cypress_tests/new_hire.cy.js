describe('As Admin User, checking pages', () => {

  const username = Cypress.env('USERNAME');
  const password = Cypress.env('PASSWORD');
  const baseUrl = Cypress.env('BASE_URL');
  const groupId = 368; // New Hire Group ID
  const fakepassword = 'CypressTest123!';

  const loginUrl = '/user/login';


  // Test Users
  const testUsers = [
    'old',
    'new',
    'affiliate',
    'admin'
  ];

  // Get the current month and year
  // Get current date in YYYY-MM-DD format
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(currentDate.getDate()).padStart(2, '0');
  const currentDateFormatted = `${year}-${month}-${day}`;

  // Get date 91 days prior in YYYY-MM-DD format
  const priorDate = new Date(currentDate);
  priorDate.setDate(priorDate.getDate() - 100);
  const priorYear = priorDate.getFullYear();
  const priorMonth = String(priorDate.getMonth() + 1).padStart(2, '0');
  const priorDay = String(priorDate.getDate()).padStart(2, '0');
  const priorDateFormatted = `${priorYear}-${priorMonth}-${priorDay}`;

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

  // 1. Create User and add to group Loop
  it('Create Users', () => {
    testUsers.forEach((user, index) => {
      cy.visit(`${baseUrl}/admin/people/create`);
      cy.get("#edit-mail").type(`cypress_test_${user}@kidney.org`, { delay: 0 });
      cy.get("#edit-name").type(`cypress_test_${user}`, { delay: 0 });
      cy.get('#edit-pass-pass1').type(fakepassword, { delay: 0 });
      cy.get('#edit-pass-pass2').type(fakepassword, { delay: 0 });
      if (user === 'affiliate') {
        cy.get('[id="edit-roles"] [type="checkbox"]').check("affiliate");
      } else {
        cy.get('[id="edit-roles"] [type="checkbox"]').check("staff");
      }
      // Conditional date logic
      let hireDate;
      if (user === 'old' || user === 'admin') {
        hireDate = priorDateFormatted;
      } else {
        hireDate = currentDateFormatted;
      }

      cy.get('[name="field_user_hire_date[0][value][date]"]').type(hireDate);
      cy.get('[data-drupal-selector="edit-submit"]').click();


    });

  });


  it('Set user to Group admin', () => {

    // 1. Masquerade as Group Admin
    cy.visit(`${baseUrl}/admin/people?user=brianadmin`);
    cy.get("table button").click();
    cy.get("li.masquerade > a").click();
    cy.location("href").should("eq", `${baseUrl}/admin/people`);
    cy.contains('You are now masquerading as Brian Admin.')
      .should('be.visible');

    // Join
    cy.visit(`${baseUrl}/group/368/join`);
    cy.get("#edit-submit").click();

    // 2. Visit the group members page
    cy.visit(`${baseUrl}/group/${groupId}/members?order=changed&sort=desc`);

    // Affiliate should not be present
    cy.contains('tr', 'cypress_test_affiliate').should('not.exist');

    // 3. Extract UID from the user's row
    cy.contains('tr', 'cypress_test_admin')
      .find('a[href*="/content/"]')
      .first()
      .invoke('attr', 'href')
      .then((href) => {
        const uid = href.match(/\/content\/(\d+)/)[1];
        return uid;
      })
      .then((uid) => {
        cy.log('groupId:', groupId);
        cy.log('UID:', uid);

        // 4. Navigate to edit page
        cy.visit(`${baseUrl}/group/${groupId}/content/${uid}/edit`);

        // 5. Edit the member (example: check "Admin" role)
        cy.get('#edit-group-roles-kc-group-admin').check();
        cy.get('[data-drupal-selector="edit-submit"]').click();

        // 6. Verify the role was saved
        cy.visit(`${baseUrl}/group/368/members?order=created&sort=desc`);
        cy.contains('tr', 'cypress_test_admin')
          .find('.views-field-group-roles')
          .should('contain', 'Admin');
      });

    // 5. Click the "Run cron" button
    cy.visit(`${baseUrl}/admin/config/system/cron`);
    cy.get('[data-drupal-selector="edit-run"]')
      .should('be.visible')
      .and('have.value', 'Run cron')
      .click();

    cy.wait(6000);

    // 6. Verify cron execution (optional)
    cy.contains('Cron ran successfully.').should('exist');

    cy.visit(`${baseUrl}/group/${groupId}/members?order=changed&sort=desc`);

    // 7. Verify PRESENCE of expected members
    cy.contains('tr', 'cypress_test_admin').should('exist');
    cy.contains('tr', 'cypress_test_new').should('exist');

    // 8. Verify ABSENCE of non-member
    cy.contains('tr', 'cypress_test_old').should('not.exist');
  });

  it('Clean up users', () => {

    // 1. Find users and select for deletion
    cy.visit(`${baseUrl}/admin/people?user=cypress_test`);
    cy.get("#edit-user-bulk-form-0").click();
    cy.get("#edit-user-bulk-form-1").click();
    cy.get("#edit-user-bulk-form-2").click();
    cy.get("#edit-user-bulk-form-3").click();

    cy.get("#edit-action").select("user_cancel_user_action");
    cy.get("#edit-submit").click();

    // 2. Verify only the path (ignores query parameters)
    cy.location('pathname').should('eq', '/admin/people/cancel');

    // 3. Select deletion option and delete users
    cy.get("#edit-user-cancel-method").click();
    cy.get("#edit-user-cancel-method-user-cancel-delete").click();
    cy.get("#edit-submit").click();

    // 4. Verify deletion confirmation
    cy.contains('has been deleted.').should('exist');

    // 5. Delete BrianAdmin user
    // cy.visit(`${baseUrl}/group/${groupId}/content/${bauid}/delete`);
  });
});

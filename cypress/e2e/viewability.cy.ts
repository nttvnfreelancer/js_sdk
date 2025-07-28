describe('Viewability spec', () => {
  it('should show AdSpot 1 with inview event after 1 sec', () => {
    const selector = 'div#adspot-1';
    cy.visit('http://bs-local.com:3111/viewability.html');
    // verify inview event
    cy.intercept(
      'GET',
      'http://bs-local.com:3111//inview?adspot_id=1&session_id=*'
    ).as('inview');
    cy.wait(1000);
    // verify inview request happened
    cy.window().focus();
    cy.get(selector).scrollIntoView();
    cy.wait(1000);
    cy.wait('@inview').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });
  });
});

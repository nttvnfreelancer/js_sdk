describe('Duplicated scripts spec', () => {
  it('should show ONLY ONE AdSpot with 300x250 size', () => {
    const selector = 'div#adspot-1';
    cy.visit('http://bs-local.com:3111/dup-script-tag.html');
    cy.wait(1000);

    // verify the visibility of the iframe
    cy.get(selector).find('iframe').should('be.visible');
    // verify the size of the iframe
    cy.get(selector).find('iframe').should('have.attr', 'width', '300');
    cy.get(selector).find('iframe').should('have.attr', 'height', '250');
    // verify the session ID
    cy.get(selector).find('iframe').should('have.attr', 'data-rdn-session');
  });
});

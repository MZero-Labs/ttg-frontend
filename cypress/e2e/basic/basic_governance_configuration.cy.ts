describe("Governance configuration", () => {
  beforeEach(() => {
    cy.visit("/config/governance");
  });

  it("I should visit governance config page and see navigation", () => {
    cy.url().should("include", "/config/governance");
    cy.findByRole("button", {name: /Create proposal/i}).should("be.visible");

    cy.get("nav").should("contain", "Home");
    cy.get("nav").should("contain", "Actors");
    cy.get("nav").should("contain", "Configs");
  });

  it("I should see all configuration parameters", () => {
    cy.get('h1').should('contain', 'Configs')
    cy.get('a.link-tab').contains('Governance').should('have.class', 'active-link-tab')
    cy.get('a.link-tab').contains('Protocol').should('be.visible')

    // changeable parameters
    const changeableConfigParams = [
      "Emergency Proposal Threshold Ratio",
      "Zero Proposal Threshold Ratio",
      "Proposal Fee",
      "Cash Token",
    ]

    cy.get('h3.text-xl').should('have.length', changeableConfigParams.length)

    changeableConfigParams.forEach((value: string) => {
      cy.get('h3.text-xl').contains(value)
    })

    const nonChangeableConfigParams = [
      "Standard Governor",
      "Emergency Governor",
      "POWER Token",
      "ZERO Governor",
      "ZERO Token",
      "Distribution Vault",
      "Registrar",
      // "M Token"
    ]

    // non-changeable parameters table
    cy.get('table').eq(0).find('tbody tr').should('have.length', nonChangeableConfigParams.length)

    nonChangeableConfigParams.forEach((value: string) => {
      cy.get('table').eq(0).find('tbody tr').contains(value)
    })
  });
});

describe("Check proposal form validation", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.findByRole("button", { name: /Create proposal/i }).click();
  });

  const listOperations = ["add", "remove", "update"];
  const listTypes = ["minters", "validators", "earners"];

  // loop through the matrix listOperations x listTypes
  listOperations.forEach((listOperation) => {
    listTypes.forEach((listType) => {
      it(`Check ${listOperation} addresses of ${listType} form`, () => {
        cy.connectWallet();
        cy.get("[data-test='proposalTypeSelect']").click();
        const buttonRegex = new RegExp(`^${listOperation} actor$`, "i");
        cy.findByRole("button", { name: buttonRegex })
          .should("be.visible")
          .click();

        // open dropdown
        cy.get("[data-test='listSelect']")
          .find("button")
          .should("have.length", 1)
          .click();

        cy.get("[data-test='list_minters']")
          .should("have.length", 1)
          .and('contain', 'Minters');

        cy.get("[data-test='list_validators']")
          .should("have.length", 1)
          .and('contain', 'Validators');

        cy.get("[data-test='list_earners']")
          .should("have.length", 1)
          .and('contain', 'Earners');

        // click submit before filling out form, expect require errors
        cy.get("[data-test='create-proposal-button-preview']")
          .should("be.visible")
          .click();

        // expect required errors
        cy.get("[data-test='proposalValue2']").should("have.class", "error");
        cy.get("[data-test='proposalValue2']")
          .parent()
          .find(".text-red-500")
          .should("contain.text", "Value is required");

        // title
        cy.get("[data-test='title']").should("have.class", "error");
        cy.get("[data-test='title']")
          .parent()
          .find(".text-red-500")
          .should("contain.text", "Value is required");

        // description
        cy.get("#md-editor-v3_1").parent().should("have.class", "border-red-500");
        cy.get("#md-editor-v3_1").parent().parent().contains("Value is required");

        // select minters
        cy.get("[data-test='listSelect']").click();
        cy.get(`[data-test="list_${listType}"]`).click();

        // proposalValue2 == address
        cy.get("[data-test='proposalValue2']").type(
          "cypress-tester-forty-two-chars-and-ens-not-supported.eth",
          { force: true }
        );
        cy.get("[data-test='proposalValue2']")
          .parent()
          .find(".text-red-500")
          .should("contain.text", "The maximum length allowed is 42");

        cy.get("[data-test='title']").type(`cypress-tester-title-${listType}`, {
          force: true,
        });

        cy.createProposalAddDescription(
          `## cypress-tester-desc-title, \n _italic_ **bold**  line break?  1. ${listType}   1. ${listType}`
        );

        // click again after filling the form
        cy.get("[data-test='create-proposal-button-preview']")
          .should("be.visible")
          .click();
      });
    });
  });

  it("Check update protocol config form", () => {
    cy.get("[data-test='proposalTypeSelect']").click();
    cy.findByRole("button", { name: /Update protocol config/i })
      .should("be.visible")
      .click();

    // open dropdown
    cy.get("[data-test='protocolConfigSelect']").as("configDropdown").click();

    const configHeadlines = [
      "Protocol",
      "Mint",
      "Interest rates",
    ];

    const configOptions = [
      "Update collateral interval",
      "Update collateral threshold",
      "Penalty rate",
      "Mint delay",
      "Mint TTL",
      "Mint ratio",
      "Minter freeze time",
      "Minter rate model",
      "Base minter rate",
      "Earner rate model",
      "Max earner rate",
    ];

    cy.get('ul.dropdown-menu-items').should("be.visible");
    cy.get('ul.dropdown-menu-items li').as("dropdownOptions")
      .should("have.length", configHeadlines.length + configOptions.length);

    configOptions.forEach((option) => {
      const buttonRegex = new RegExp(`^${option}`, "i");

      cy.get("@dropdownOptions").should("contain.text", option);
      cy.findByRole("button", { name: buttonRegex })
        .should("be.visible")
        .click();

      cy.get("[data-test='proposalValue2']")
        .should("exist")
        .should("be.visible");
      cy.get("[data-test='title']").should("exist").should("be.visible");
      cy.get("[data-test='description']").should("exist").should("be.visible");
      cy.get("[data-test='create-proposal-input-url-ipfs']")
        .should("exist")
        .should("be.visible");
      cy.get("[data-test='create-proposal-input-url-discussion']")
        .should("exist")
        .should("be.visible");
      cy.get("[data-test='create-proposal-button-preview']")
        .should("exist")
        .should("be.visible");

      cy.get("[data-test='protocolConfigSelect']").as("configDropdown").click();
    });
  });
});

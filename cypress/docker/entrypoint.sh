#!/bin/bash

# start yarn dev server in background
pm2 start

# test_run groups
# - emergencyProposals
# - standardProposals
# - zeroProposals

# check if env var TEST_RUN is set
if [ -n "$TEST_RUN" ]; then
  SPECS_STRING="cypress/e2e/${TEST_RUN}/**.cy.ts"
else
  SPECS_STRING="cypress/e2e/**.cy.ts"
fi

echo "TEST_RUN: $TEST_RUN - SPECS_STRING: $SPECS_STRING"

# start cypress
cypress run --e2e --spec "${SPECS_STRING}"

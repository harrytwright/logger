HAS_WORKSPACES=$(node ./scripts/version.js)

if [ "${HAS_WORKSPACES}" == "TRUE" ]; then
    npm test --workspaces --if-present
else
  for d in ./redactions/*/ ; do
    (cd "$d" && npm test --if-present)
  done
fi

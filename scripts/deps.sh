HAS_WORKSPACES=$(node ./scripts/version.js)

if [ "${HAS_WORKSPACES}" == "TRUE" ]; then
    npm ci
else
  for d in ./redactions/*/ ; do
    (cd "$d" && npm ci)
  done
fi

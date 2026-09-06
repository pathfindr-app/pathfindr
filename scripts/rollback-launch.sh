#!/bin/sh
set -eu
# Restores the exact production deployment from before the relaunch pass.
exec vercel rollback https://pathfindralpha-o85tgg68x-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects

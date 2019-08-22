#!/bin/bash
set -e
# relativize stylesheet paths
git grep -l 'href="/' -- games/ | xargs sed -i '' -e 's,href="/,href="../../,g'
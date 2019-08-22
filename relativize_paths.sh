#!/bin/bash
set -e
# relativize stylesheet paths
git grep -l 'href="/' -- games/ | xargs sed -i '' -e 's,href="/,href="../../,g'
# relativize src paths
git grep -l 'src="/' -- games/ | xargs sed -i '' -e 's,src="/,src="../../,g'

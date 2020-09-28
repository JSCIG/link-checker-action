# link-checker-action

Link Checker on GitHub Action

## Usage

```yaml
name: Link Checking

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master

jobs:
  link-checking:
    name: Link Checking
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: JSCIG/link-checker-action@latest
```

## License

[MIT](LICENSE) &copy; 2020 JavaScript Chinese Interest Group

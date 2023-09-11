# Proton pollution check
A tool for auto-checking JavaScript proton pollution in npm packages. There are two js files:

1. `proton_pollution_check.js`: Automatically checks single packages.
2. `proton_pollution_check_auto.js`: Checks multiple packages via automatic installation and uninstallation of npm packages.

This project is referenced from the GitHub project: https://github.com/HoLyVieR/prototype-pollution-nsec18
## Advantage
The tools can find npm packages' proton pollution problems simply and automatically. The tool proton_pollution_check_auto.js can filter npm packages, automatically install npm packages, check the issues, and uninstall them.

## Usage
### proton_pollution_check.js
To run this, use the following command:
node proton_check.js npm_package_name version_number

`node proton_pollution_check.js js-merge-object 1.0.0`: This command checks the npm package js-merge-object with version 1.0.0.
`node proton_pollution_check.js js-merge-object`: This command checks the npm package js-merge-object with the latest version.
### proton_pollution_check_auto.js
To run this, use the following command:
`node proton_pollution_check_auto.js filter_string version_number`

`node proton_pollution_check.js merge 1.0.0`: This command checks all npm packages' names that contain "merge" with version 1.0.0.
`node proton_pollution_check.js js-merge-object`: This command checks all npm packages' names that contain "merge" with the latest version.
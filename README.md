# Scripts Repository

A collection of automation scripts for log analysis, testing, and site monitoring.

## Overview

This repository contains various scripts and test suites for:
- **Log Collection & Analysis**: Automated collection and parsing of Pantheon server logs
- **Visual Regression Testing**: BackstopJS configuration for visual testing
- **End-to-End Testing**: Cypress test suites for functional testing
- **Site Monitoring**: Backup monitoring and reporting

## Contents

### Main Scripts

#### `daily_run.sh`
Comprehensive log collection and analysis script for Pantheon-hosted sites.

**Features:**
- Collects logs from Pantheon app servers and database servers
- Aggregates nginx access logs
- Generates HTML reports for search queries
- Creates GoAccess statistics reports
- Monitors backup dates across multiple sites

**Prerequisites:**
- [Terminus CLI](https://docs.pantheon.io/terminus) installed and authenticated
- [GoAccess](https://goaccess.io/) for log analysis
- SSH access to Pantheon servers

**Configuration:**
```bash
# Required settings
SITE_UUID=UUID                    # Site UUID from Dashboard URL
ENV=live                          # Environment: dev/test/live/or Multidev

# Optional settings
AGGREGATE_NGINX=false             # Set to true to aggregate nginx logs
COLLECT_LOGS=true                 # Set to false to skip log collection
CLEANUP_AGGREGATE_DIR=false       # Clean up aggregate logs directory
```

### Testing Suites

#### `/cypress_tests/`
Cypress end-to-end test suites including:
- `admin_access.cy.js` - Admin authentication and access testing
- `admin_views.cy.js` - Admin interface functionality testing
- `cypress_user.cy.js` - User workflow testing
- `new_hire.cy.js` - New hire process testing
- `pdf_check.cy.js` - PDF generation and validation testing

#### `/backstop_tests/`
BackstopJS visual regression testing configuration:
- `backstop.json` - Main configuration file for visual testing scenarios

## Usage

### Running the Daily Log Analysis

1. **Setup Terminus authentication:**
   ```bash
   terminus auth:login
   ```

2. **Configure the script:**
   Edit `daily_run.sh` and set your site UUID and environment:
   ```bash
   SITE_UUID=your-site-uuid-here
   ENV=live
   ```

3. **Run the script:**
   ```bash
   chmod +x daily_run.sh
   ./daily_run.sh
   ```

### Running Cypress Tests

```bash
# Navigate to cypress tests directory
cd cypress_tests

# Run specific test
npx cypress run --spec "admin_access.cy.js"

# Run all tests
npx cypress run
```

### Running BackstopJS Tests

```bash
# Navigate to backstop tests directory
cd backstop_tests

# Run visual regression tests
npx backstop test

# Approve reference images
npx backstop approve
```

## Output Files

The `daily_run.sh` script generates several output files:

- `sites/default/files/Search_YYYYMMDD.html` - Daily search query reports
- `sites/default/files/YYYYMMDD.html` - GoAccess statistics reports
- `aggregate-logs/combined.logs` - Combined nginx access logs (if enabled)
- `working/file.log` - Temporary concatenated log file (cleaned up automatically)

## Dependencies

- **Bash** - Shell script execution
- **Terminus CLI** - Pantheon platform interface
- **GoAccess** - Web log analyzer
- **rsync** - File synchronization
- **Node.js & npm** - For Cypress and BackstopJS
- **Cypress** - End-to-end testing framework
- **BackstopJS** - Visual regression testing

## Installation

1. **Install Terminus:**
   ```bash
   curl -O https://raw.githubusercontent.com/pantheon-systems/terminus-installer/master/builds/installer.phar && php installer.phar install
   ```

2. **Install GoAccess:**
   ```bash
   # macOS
   brew install goaccess
   
   # Ubuntu/Debian
   sudo apt-get install goaccess
   ```

3. **Install Node.js dependencies:**
   ```bash
   npm install cypress backstopjs
   ```

## Configuration Notes

- Ensure SSH keys are properly configured for Pantheon server access
- The script uses port 2222 for SSH connections to Pantheon servers
- Log files are automatically cleaned up after processing
- Reports are automatically synced to the `dailylogs.dev` site

## Monitoring Features

- **Search Query Analysis**: Tracks and reports popular search terms
- **Backup Monitoring**: Checks backup dates across multiple sites
- **Access Log Analysis**: Generates comprehensive web traffic reports
- **Automated Reporting**: Creates HTML reports for easy viewing

## Security Considerations

- Site UUIDs and sensitive configuration should be properly secured
- SSH keys should follow best practices for access management
- Log files may contain sensitive information and should be handled appropriately

## Contributing

When adding new scripts or tests:
1. Follow existing naming conventions
2. Include appropriate error handling
3. Update this README with new functionality
4. Test thoroughly before committing

## License

[Add your license information here]

## Support

For issues or questions:
- Check the Pantheon documentation for Terminus-related issues
- Refer to Cypress and BackstopJS documentation for testing issues
- Review GoAccess documentation for log analysis questions


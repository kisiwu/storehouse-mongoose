# Changelog

## [Unreleased]

### Added

#### Health Check Support
- Sync `MongooseManager` class to @storehouse/core >= 2 `IManager` interface:
  - Added `healthCheck()` method to `MongooseManager` class for connection health verification
  - Added `isConnected()` method to `MongooseManager` class for connection status checking

### Changed

#### Breaking Changes
- Error handling now throws specific error types instead of generic `Error` instances
- Due to mongoose >= 9:
  - Property `id: string` is required in `TVirtuals` of `Model`. If an interface for virtual properties is defined, it should have that property.

### Testing
- `id: string` required in `TVirtuals` of `Model`

### Internal
- Improved type safety in aggregation's `countDocuments()`
- Better error handling
- Consistent use of private fields with `#` syntax


[Unreleased]: https://github.com/kisiwu/storehouse-core/compare/HEAD
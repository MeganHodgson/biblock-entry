# BiBlock Entry Athlete Registration System - API Reference

## Smart Contract Functions

### Core Functions

#### `registerAthlete(externalEuint32 encryptedName, externalEuint32 encryptedAge, externalEuint32 encryptedContact, externalEuint32 encryptedCategory, bytes inputProof)`
Register a new athlete with encrypted personal data.
- **Parameters:**
  - `encryptedName`: Encrypted athlete name
  - `encryptedAge`: Encrypted athlete age
  - `encryptedContact`: Encrypted contact information
  - `encryptedCategory`: Encrypted sport category
  - `inputProof`: FHE input proof

#### `batchRegisterAthletes(address[] athletes, externalEuint32[] encryptedNames, externalEuint32[] encryptedAges, externalEuint32[] encryptedContacts, externalEuint32[] encryptedCategories, bytes inputProof)`
Register multiple athletes in a single transaction.
- **Parameters:**
  - `athletes`: Array of athlete addresses
  - Arrays of encrypted personal data
  - Single input proof for batch processing
  - Maximum 10 athletes per batch

### Statistics Functions

#### `getRegistrationStatistics()`
Get comprehensive athlete registration statistics.
- **Returns:** `(totalAthletes, decryptedCount, averageRegistrationTime)`

#### `isAthleteRegistered(address athlete)`
Check if an athlete is registered.
- **Returns:** Boolean indicating registration status

#### `getRegisteredAthletes()`
Get all registered athlete addresses.
- **Returns:** Array of athlete addresses

### Data Access Functions

#### `getDecryptedAthleteInfo(address athlete)`
Get decrypted athlete information (after decryption).
- **Returns:** `(name, age, contact, sportCategory, isDecrypted)`

#### `getPlainAthleteInfo(address athlete)`
Get plain text athlete information (for local testing).
- **Returns:** `(name, age, contact, sportCategory)`

#### `finalizeResults(address athlete, string name, uint256 age, uint256 contact)`
Finalize athlete registration by storing decrypted data.
- **Parameters:**
  - `athlete`: Athlete address
  - `name`: Decrypted name
  - `age`: Decrypted age
  - `contact`: Decrypted contact

### Sport Categories

- `0`: Individual - Individual sports
- `1`: Team - Team sports
- `2`: Endurance - Endurance sports
- `3`: Combat - Combat sports
- `4`: Other - Other categories

### Age Requirements

- Individual: 16+
- Team: 14+
- Endurance: 18+
- Combat: 16+
- Other: 14+

## Security Features

- **FHE Encryption**: All personal data is fully homomorphically encrypted
- **Private Registration**: Athlete data remains encrypted throughout registration
- **Secure Decryption**: Users can only access their own decrypted data
- **Zero-Knowledge**: No plaintext data is stored or revealed

## Error Handling

- Invalid athlete addresses
- Double registration attempts
- Age requirement violations
- Array length mismatches in batch operations
- Gas limit exceeded for large batches

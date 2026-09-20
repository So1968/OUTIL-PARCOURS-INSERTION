MODELES PRINCIPAUX

User
- id
- email
- passwordHash
- firstName
- lastName
- role
- isActive
- createdAt
- updatedAt

Role
- SOCIO_PRO
- TNS
- DIRECTION
- ADMIN_TECHNIQUE
- RELAIS

Person
- id
- firstName
- lastName
- age
- insertisId
- primaryReferentId
- createdAt
- updatedAt
- archivedAt nullable

SharedCase
- id
- personId
- currentPathType
- currentPathStep
- shortSummary
- continuityNote
- nextStep
- vigilance
- createdAt
- updatedAt

ProfessionalPrivateSpace
- id
- personId
- ownerUserId
- relationshipAidNote
- hypotheses
- professionalPosture
- sensitiveNotes
- drafts
- createdAt
- updatedAt

SocleAssessment
- id
- personId
- completedByUserId
- completedAt
- rightsScore
- organizationScore
- budgetScore
- healthScore
- mobilityScore
- writtenDigitalScore
- familyScore
- projectScore
- notesJson

SuggestedModule
- id
- personId
- moduleType
- suggestionLevel
- status
- suggestedByAssessmentId nullable
- decidedByUserId nullable
- decidedAt nullable

ModuleRecord
- id
- personId
- moduleType
- status
- openedByUserId
- updatedByUserId
- openedAt
- updatedAt
- dataJson

ShortSummaryVersion
- id
- sharedCaseId
- content
- modifiedByUserId
- modifiedAt

ContinuityNoteVersion
- id
- sharedCaseId
- content
- modifiedByUserId
- modifiedAt

AuditLog
- id
- actorUserId
- personId nullable
- entityType
- entityId
- actionType
- metadataJson
- createdAt

LoginLog
- id
- userId
- success
- ipAddress nullable
- userAgent nullable
- createdAt

PasswordResetToken
- id
- userId
- tokenHash
- expiresAt
- usedAt nullable
- createdAt

# Authentication Sequence Diagrams

Paste each block into: https://www.plantuml.com/plantuml/uml/

---

## Auth Page 1 — User Registration

```plantuml
@startuml

skinparam defaultFontSize 14
skinparam defaultFontStyle bold
skinparam sequenceArrowThickness 2
skinparam sequenceArrowFontSize 13
skinparam sequenceArrowFontStyle bold
skinparam sequenceParticipantBorderColor black
skinparam sequenceParticipantBorderThickness 3
skinparam sequenceParticipantBackgroundColor white
skinparam sequenceParticipantFontStyle bold
skinparam sequenceParticipantFontSize 14
skinparam sequenceLifeLineBorderColor black
skinparam sequenceLifeLineBorderThickness 2
skinparam sequenceActivationBorderColor black
skinparam sequenceActivationBorderThickness 3
skinparam sequenceActivationBackgroundColor #D0D0D0
skinparam dividerBorderColor black
skinparam dividerFontStyle bold
skinparam dividerFontSize 13
skinparam shadowing false
skinparam monochrome true
skinparam participantPadding 5
skinparam maxMessageSize 120
hide footbox
skinparam sequenceGroupBorderColor black
skinparam sequenceGroupBorderThickness 1
skinparam sequenceGroupBackgroundColor transparent
skinparam sequenceGroupFontStyle bold
skinparam sequenceGroupFontSize 13

actor       "**User**"       as U
participant "**Frontend**"   as F
participant "**Controller**" as CT
participant "**Service**"    as S
participant "**Prisma ORM**" as P
participant "**Email**"      as E
database    "**PostgreSQL**" as DB

== User Registration ==

U  ->  F  : register\n(username, email, password)
activate F
F  ->  CT : POST /api/auth/register
activate CT
CT ->  S  : register(data)
activate S
S  ->  P  : findByEmail(email)
activate P
P  ->  DB : SELECT
activate DB
DB --> CT : null
deactivate DB
deactivate P
S  ->  P  : saveUser\n(data, UNVERIFIED)
activate P
P  ->  DB : INSERT
activate DB
DB --> CT : user
deactivate DB
deactivate P
S  ->  P  : saveOtp(userId, otp)
activate P
P  ->  DB : INSERT
activate DB
DB --> CT : ok
deactivate DB
deactivate P
S  ->  E  : sendVerificationEmail\n(email, otp)
activate E
E  --> S  : sent
deactivate E
S  --> CT : { token, userId }
deactivate S
CT --> F  : 201 Created { token }
deactivate CT
F  --> U  : showVerifyEmailPage()
deactivate F

|||
|||
|||
|||
|||
destroy U
destroy F
destroy CT
destroy S
destroy P
destroy E
destroy DB

@enduml
```

---

## Auth Page 2 — Email Verification

```plantuml
@startuml

skinparam defaultFontSize 14
skinparam defaultFontStyle bold
skinparam sequenceArrowThickness 2
skinparam sequenceArrowFontSize 13
skinparam sequenceArrowFontStyle bold
skinparam sequenceParticipantBorderColor black
skinparam sequenceParticipantBorderThickness 3
skinparam sequenceParticipantBackgroundColor white
skinparam sequenceParticipantFontStyle bold
skinparam sequenceParticipantFontSize 14
skinparam sequenceLifeLineBorderColor black
skinparam sequenceLifeLineBorderThickness 2
skinparam sequenceActivationBorderColor black
skinparam sequenceActivationBorderThickness 3
skinparam sequenceActivationBackgroundColor #D0D0D0
skinparam dividerBorderColor black
skinparam dividerFontStyle bold
skinparam dividerFontSize 13
skinparam shadowing false
skinparam monochrome true
skinparam participantPadding 5
skinparam maxMessageSize 120
hide footbox
skinparam sequenceGroupBorderColor black
skinparam sequenceGroupBorderThickness 1
skinparam sequenceGroupBackgroundColor transparent
skinparam sequenceGroupFontStyle bold
skinparam sequenceGroupFontSize 13

actor       "**User**"       as U
participant "**Frontend**"   as F
participant "**Controller**" as CT
participant "**Service**"    as S
participant "**Prisma ORM**" as P
database    "**PostgreSQL**" as DB

== Email Verification ==

U  ->  F  : submitOtp(otp)
activate F
F  ->  CT : POST /api/auth/verify-email
activate CT
CT ->  S  : verifyEmail(otp)
activate S
S  ->  P  : findOtp(otp)
activate P
P  ->  DB : SELECT
activate DB
DB --> CT : otpRecord
deactivate DB
deactivate P

alt valid token
  S  ->  P  : activateUser(userId)
  activate P
  P  ->  DB : UPDATE emailVerified=true
  activate DB
  DB --> CT : ok
  deactivate DB
  deactivate P
  S  --> CT : { success: true }
  CT --> F  : 200 OK { success }
  F  --> U  : showLoginPage()
else invalid token
  S  --> CT : 400 Invalid OTP
  CT --> F  : 400 Bad Request
  F  --> U  : showError()
end
deactivate S
deactivate CT
deactivate F

|||
|||
|||
|||
|||
|||
|||
destroy U
destroy F
destroy CT
destroy S
destroy P
destroy DB

@enduml
```

---

## Auth Page 3 — User Login

```plantuml
@startuml

skinparam defaultFontSize 14
skinparam defaultFontStyle bold
skinparam sequenceArrowThickness 2
skinparam sequenceArrowFontSize 13
skinparam sequenceArrowFontStyle bold
skinparam sequenceParticipantBorderColor black
skinparam sequenceParticipantBorderThickness 3
skinparam sequenceParticipantBackgroundColor white
skinparam sequenceParticipantFontStyle bold
skinparam sequenceParticipantFontSize 14
skinparam sequenceLifeLineBorderColor black
skinparam sequenceLifeLineBorderThickness 2
skinparam sequenceActivationBorderColor black
skinparam sequenceActivationBorderThickness 3
skinparam sequenceActivationBackgroundColor #D0D0D0
skinparam dividerBorderColor black
skinparam dividerFontStyle bold
skinparam dividerFontSize 13
skinparam shadowing false
skinparam monochrome true
skinparam participantPadding 5
skinparam maxMessageSize 120
hide footbox
skinparam sequenceGroupBorderColor black
skinparam sequenceGroupBorderThickness 1
skinparam sequenceGroupBackgroundColor transparent
skinparam sequenceGroupFontStyle bold
skinparam sequenceGroupFontSize 13

actor       "**User**"       as U
participant "**Frontend**"   as F
participant "**Controller**" as CT
participant "**Service**"    as S
participant "**Prisma ORM**" as P
database    "**PostgreSQL**" as DB

== User Login ==

U  ->  F  : login(username, password)
activate F
F  ->  CT : POST /api/auth/login
activate CT
CT ->  S  : login(credentials, ip)
activate S
S  ->  P  : checkIpAttempts(ip)
activate P
P  ->  DB : SELECT loginAttempts
activate DB
DB --> CT : count
deactivate DB
deactivate P
S  ->  P  : findUser(username)
activate P
P  ->  DB : SELECT
activate DB
DB --> CT : user
deactivate DB
deactivate P
S  ->  S  : verifyPassword\n(password, hash)

alt valid credentials
  S  ->  P  : saveLoginAttempt(success)
  activate P
  P  ->  DB : INSERT
  activate DB
  DB --> CT : ok
  deactivate DB
  deactivate P
  S  ->  P  : saveRefreshToken(userId)
  activate P
  P  ->  DB : INSERT
  activate DB
  DB --> CT : ok
  deactivate DB
  deactivate P
  S  --> CT : { accessToken, refreshToken }
  CT --> F  : 200 OK { tokens }
  F  --> U  : redirectToDashboard()
else invalid credentials
  S  ->  P  : saveLoginAttempt(failed)
  activate P
  P  ->  DB : INSERT
  activate DB
  DB --> CT : ok
  deactivate DB
  deactivate P
  S  --> CT : 401 Unauthorized
  CT --> F  : 401 Unauthorized
  F  --> U  : showError()
end
deactivate S
deactivate CT
deactivate F

|||
|||
|||
|||
|||
|||
|||
destroy U
destroy F
destroy CT
destroy S
destroy P
destroy DB

@enduml
```

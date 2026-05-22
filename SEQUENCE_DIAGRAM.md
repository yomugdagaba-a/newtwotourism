# Hotel Booking Workflow — Sequence Diagrams (3 Pages)

Paste each block into: https://www.plantuml.com/plantuml/uml/

---

## Page 1 — Phase 1 & 2

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

actor       "**Client**"     as C
actor       "**Owner**"      as O
participant "**Frontend**"   as F
participant "**Controller**" as CT
participant "**Service**"    as S
participant "**Prisma ORM**" as P
database    "**PostgreSQL**" as DB

== Phase 1: Client Browses Hotels ==

C  ->  F  : browseHotels()
activate F
F  ->  CT : GET /api/hotels
activate CT
CT ->  S  : getHotels()
activate S
S  ->  P  : findAll()
activate P
P  ->  DB : SELECT
activate DB
DB --> CT : hotelList
deactivate DB
deactivate P
deactivate S
CT --> F  : 200 OK { hotelList }
deactivate CT
F  --> C  : displayHotelList()
deactivate F

== Phase 2: Client Creates a Booking ==

C  ->  F  : bookHotel\n(hotelId, dates, guests)
activate F
F  ->  CT : POST /api/bookings
activate CT
CT ->  S  : createBooking\n(data, userId)
activate S
S  ->  P  : save(booking, REQUESTED)
activate P
P  ->  DB : INSERT
activate DB
DB --> CT : booking
deactivate DB
deactivate P
deactivate S
CT --> F  : 201 Created { booking }
deactivate CT
F  --> C  : showConfirmation()
deactivate F

|||
|||
|||
|||
|||
|||
|||
destroy C
destroy O
destroy F
destroy CT
destroy S
destroy P
destroy DB

@enduml
```

---

## Page 2 — Phase 3 & 4

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

actor       "**Client**"     as C
actor       "**Owner**"      as O
participant "**Frontend**"   as F
participant "**Controller**" as CT
participant "**Service**"    as S
participant "**Prisma ORM**" as P
database    "**PostgreSQL**" as DB

== Phase 3: Owner Views and Accepts ==

O  ->  F  : viewBookings()
activate F
F  ->  CT : GET /api/bookings/owner
activate CT
CT ->  S  : getBookingsByOwner\n(ownerId)
activate S
S  ->  P  : findByOwner(ownerId)
activate P
P  ->  DB : SELECT
activate DB
DB --> CT : bookingList
deactivate DB
deactivate P
deactivate S
CT --> F  : 200 OK { bookingList }
deactivate CT
F  --> O  : displayBookingList()
deactivate F

O  ->  F  : acceptBooking(bookingId)
activate F
F  ->  CT : POST /api/bookings\n/:id/accept
activate CT
CT ->  S  : acceptRequest\n(bookingId, ownerId)
activate S
S  ->  P  : updateStatus\n(OWNER_ACCEPTED)
activate P
P  ->  DB : UPDATE
activate DB
DB --> CT : updatedBooking
deactivate DB
deactivate P
deactivate S
CT --> F  : 200 OK { updatedBooking }
deactivate CT
F  --> O  : showAccepted()
deactivate F

== Phase 4: Owner Proposes Cost ==

O  ->  F  : proposeCost\n(bookingId, amount)
activate F
F  ->  CT : POST /api/bookings/:id/cost
activate CT
CT ->  S  : proposeCost\n(bookingId, amount, ownerId)
activate S
S  ->  P  : saveCostProposal\n(amount, COST_PROPOSED)
activate P
P  ->  DB : UPDATE
activate DB
DB --> CT : updatedBooking
deactivate DB
deactivate P
deactivate S
CT --> F  : 200 OK { updatedBooking }
deactivate CT
F  --> O  : showCostProposed()
deactivate F

|||
|||
|||
|||
|||
|||
|||
destroy C
destroy O
destroy F
destroy CT
destroy S
destroy P
destroy DB

@enduml
```

---

## Page 3 — Phase 5 & 6

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
skinparam noteBorderColor black
skinparam noteBackgroundColor white
skinparam noteFontStyle bold
skinparam noteFontSize 13
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

actor       "**Client**"     as C
actor       "**Owner**"      as O
participant "**Frontend**"   as F
participant "**Controller**" as CT
participant "**Service**"    as S
participant "**Prisma ORM**" as P
database    "**PostgreSQL**" as DB

== Phase 5: Client Uploads Receipt ==

C  ->  F  : uploadReceipt\n(bookingId, file)
activate F
F  ->  CT : POST /api/bookings\n/:id/receipt/upload
activate CT
CT ->  S  : uploadReceipt\n(bookingId, file, userId)
activate S
S  ->  P  : saveReceipt\n(receiptUrl, PAID)
activate P
P  ->  DB : UPDATE
activate DB
DB --> CT : updatedBooking
deactivate DB
deactivate P
deactivate S
CT --> F  : 200 OK { updatedBooking }
deactivate CT
F  --> C  : showReceiptUploaded()
deactivate F

== Phase 6: Owner Approves the Booking ==

O  ->  F  : approveBooking(bookingId)
activate F
F  ->  CT : POST /api/bookings\n/:id/approve
activate CT
CT ->  S  : approveBooking\n(bookingId, ownerId)
activate S
S  ->  P  : updateStatus(APPROVED)
activate P
P  ->  DB : UPDATE
activate DB
DB --> CT : updatedBooking
deactivate DB
deactivate P
deactivate S
CT --> F  : 200 OK { updatedBooking }
deactivate CT
F  --> O  : showApproved()
deactivate F

note over F, CT
  WebSocket notifies Client instantly
end note

|||
|||
|||
|||
|||
|||
|||
destroy C
destroy O
destroy F
destroy CT
destroy S
destroy P
destroy DB

@enduml
```

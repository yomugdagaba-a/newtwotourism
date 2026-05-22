# Entity Relationship Diagram — North Wollo Tourism System

Paste each block into: https://www.plantuml.com/plantuml/uml/

---

## ER Page 1 — User and Authentication Entities

```plantuml
@startuml

skinparam defaultFontSize 12
skinparam defaultFontStyle bold
skinparam classBorderColor black
skinparam classBorderThickness 2
skinparam classBackgroundColor white
skinparam classHeaderBackgroundColor white
skinparam classFontStyle bold
skinparam classFontSize 12
skinparam classAttributeFontStyle bold
skinparam classAttributeFontSize 12
skinparam arrowThickness 1.5
skinparam arrowColor black
skinparam shadowing false
skinparam monochrome true
skinparam nodesep 25
skinparam ranksep 40

' ── ROW 1: roles | users | audit_log_entries ────────────────────

entity "**roles**" as roles {
  * id : int <<PK>>
  --
  name : varchar <<UK>>
  created_at : timestamp
  updated_at : timestamp
}

entity "**users**" as users {
  * id : int <<PK>>
  --
  username : varchar <<UK>>
  email : varchar <<UK>>
  password_hash : varchar
  full_name : varchar
  active : boolean
  email_verified : boolean
  email_verified_at : timestamp
  created_at : timestamp
  updated_at : timestamp
}

entity "**audit_log_entries**" as audit_logs {
  * id : int <<PK>>
  --
  user_id : int <<FK>>
  action : varchar
  entity_type : varchar
  entity_id : int
  changes : jsonb
  ip_address : varchar
  status : varchar
  created_at : timestamp
}

' ── ROW 2: user_roles | refresh_tokens | login_attempts | account_lockouts ──

entity "**user_role_assignments**" as user_roles {
  * user_id : int <<FK>>
  * role_id : int <<FK>>
}

entity "**refresh_tokens**" as refresh_tokens {
  * id : int <<PK>>
  --
  user_id : int <<FK>>
  token : text <<UK>>
  expires_at : timestamp
  created_at : timestamp
}

entity "**login_attempts**" as login_attempts {
  * id : int <<PK>>
  --
  user_id : int <<FK>>
  ip_address : varchar
  success : boolean
  reason : varchar
  created_at : timestamp
}

entity "**account_lockouts**" as account_lockouts {
  * id : int <<PK>>
  --
  user_id : int <<FK>> <<UK>>
  locked_until : timestamp
  created_at : timestamp
}

' ── ROW 3: email_tokens | pwd_tokens ────────────────────────────

entity "**email_verification_tokens**" as email_tokens {
  * id : int <<PK>>
  --
  user_id : int <<FK>>
  token : varchar <<UK>>
  email : varchar
  expires_at : timestamp
  verified : boolean
  attempt_count : int
  created_at : timestamp
}

entity "**password_reset_tokens**" as pwd_tokens {
  * id : int <<PK>>
  --
  user_id : int <<FK>>
  token : varchar <<UK>>
  expires_at : timestamp
  used : boolean
  attempt_count : int
  created_at : timestamp
}

' ── HIDDEN ARROWS: force vertical rows ──────────────────────────
roles           -[hidden]right- users
users           -[hidden]right- audit_logs

users           -[hidden]down-  refresh_tokens
user_roles      -[hidden]right- refresh_tokens
refresh_tokens  -[hidden]right- login_attempts
login_attempts  -[hidden]right- account_lockouts

refresh_tokens  -[hidden]down-  email_tokens
email_tokens    -[hidden]right- pwd_tokens

' ── REAL RELATIONSHIPS ──────────────────────────────────────────
users           ||--o{ user_roles         : "assigned"
roles           ||--o{ user_roles         : "assigned to"
users           ||--o{ refresh_tokens     : "has"
users           ||--o{ login_attempts     : "logs"
users           ||--o| account_lockouts   : "may have"
users           ||--o{ email_tokens       : "has"
users           ||--o{ pwd_tokens         : "has"
users           ||--o{ audit_logs         : "generates"

@enduml
```

---

## ER Page 2 — Tourism, Hotel and Booking Entities

```plantuml
@startuml

skinparam defaultFontSize 12
skinparam defaultFontStyle bold
skinparam classBorderColor black
skinparam classBorderThickness 2
skinparam classBackgroundColor white
skinparam classHeaderBackgroundColor white
skinparam classFontStyle bold
skinparam classFontSize 12
skinparam classAttributeFontStyle bold
skinparam classAttributeFontSize 12
skinparam arrowThickness 1.5
skinparam arrowColor black
skinparam shadowing false
skinparam monochrome true
skinparam nodesep 25
skinparam ranksep 40

' ── ROW 1: users | tourism_places | booking_statuses ────────────

entity "**users**" as users {
  * id : int <<PK>>
  --
  username : varchar
  email : varchar
}

entity "**tourism_places**" as tourism_places {
  * id : int <<PK>>
  --
  name : varchar
  category : varchar
  description : text
  wereda : varchar
  kebele : varchar
  best_time : varchar
  languages : text[]
  status : varchar
  viewers_count : int
  image_url : varchar
  latitude : float
  longitude : float
  created_at : timestamp
  updated_at : timestamp
}

entity "**booking_statuses**" as booking_statuses {
  * id : int <<PK>>
  --
  name : varchar <<UK>>
  created_at : timestamp
}

' ── ROW 2: tourism_views | tourism_images | tourism_ratings | hotels ──

entity "**tourism_views**" as tourism_views {
  * id : int <<PK>>
  --
  tourism_place_id : int <<FK>>
  session_id : varchar
  ip_address : varchar
  viewed_at : timestamp
}

entity "**tourism_images**" as tourism_images {
  * id : int <<PK>>
  --
  tourism_place_id : int <<FK>>
  image_url : text
  display_order : int
  created_at : timestamp
}

entity "**tourism_ratings**" as tourism_ratings {
  * id : int <<PK>>
  --
  tourism_place_id : int <<FK>>
  user_id : int <<FK>>
  rating : int
  comment : text
  created_at : timestamp
}

entity "**hotels**" as hotels {
  * id : int <<PK>>
  --
  tourism_place_id : int <<FK>>
  owner_id : int <<FK>>
  name : varchar
  star_rating : int
  contact_info : varchar
  description : text
  active : boolean
  latitude : float
  longitude : float
  created_at : timestamp
  updated_at : timestamp
}

' ── ROW 3: hotel_images | hotel_ratings | hotel_bookings ────────

entity "**hotel_images**" as hotel_images {
  * id : int <<PK>>
  --
  hotel_id : int <<FK>>
  image_url : text
  display_order : int
  created_at : timestamp
}

entity "**hotel_ratings**" as hotel_ratings {
  * id : int <<PK>>
  --
  hotel_id : int <<FK>>
  user_id : int <<FK>>
  rating : int
  comment : text
  created_at : timestamp
}

entity "**hotel_bookings**" as hotel_bookings {
  * id : int <<PK>>
  --
  hotel_id : int <<FK>>
  user_id : int <<FK>>
  status_id : int <<FK>>
  check_in : timestamp
  check_out : timestamp
  number_of_guests : int
  total_cost : decimal
  receipt_image_url : varchar
  problem_reported : boolean
  hidden_from_client : boolean
  hidden_from_owner : boolean
  created_at : timestamp
  updated_at : timestamp
}

' ── ROW 4: booking_messages ─────────────────────────────────────

entity "**booking_messages**" as booking_messages {
  * id : int <<PK>>
  --
  booking_id : int <<FK>>
  user_id : int <<FK>>
  message : text
  is_from_owner : boolean
  created_at : timestamp
}

' ── HIDDEN ARROWS: force grid layout ────────────────────────────
' Row 1 horizontal
users               -[hidden]right- tourism_places
tourism_places      -[hidden]right- booking_statuses

' Row 1 → Row 2 vertical anchors
tourism_places      -[hidden]down-  tourism_images
users               -[hidden]down-  tourism_views

' Row 2 horizontal
tourism_views       -[hidden]right- tourism_images
tourism_images      -[hidden]right- tourism_ratings
tourism_ratings     -[hidden]right- hotels

' Row 2 → Row 3 vertical anchors
hotels              -[hidden]down-  hotel_bookings
tourism_images      -[hidden]down-  hotel_images

' Row 3 horizontal
hotel_images        -[hidden]right- hotel_ratings
hotel_ratings       -[hidden]right- hotel_bookings

' Row 3 → Row 4
hotel_bookings      -[hidden]down-  booking_messages

' ── REAL RELATIONSHIPS ──────────────────────────────────────────
tourism_places  ||--o{ tourism_images     : "has"
tourism_places  ||--o{ tourism_ratings    : "receives"
tourism_places  ||--o{ tourism_views      : "tracked by"
tourism_places  ||--o{ hotels             : "has"

users           ||--o{ tourism_ratings    : "writes"
users           ||--o{ hotel_ratings      : "writes"
users           ||--o{ hotel_bookings     : "makes"
users           ||--o{ hotels             : "owns"
users           ||--o{ booking_messages   : "sends"

hotels          ||--o{ hotel_images       : "has"
hotels          ||--o{ hotel_ratings      : "receives"
hotels          ||--o{ hotel_bookings     : "has"

hotel_bookings  ||--o{ booking_messages   : "has"
booking_statuses ||--o{ hotel_bookings    : "defines"

@enduml
```

---

## ER Page 3 — Road, Horse, Language Guider, Map and Hero Entities

```plantuml
@startuml

skinparam defaultFontSize 12
skinparam defaultFontStyle bold
skinparam classBorderColor black
skinparam classBorderThickness 2
skinparam classBackgroundColor white
skinparam classHeaderBackgroundColor white
skinparam classFontStyle bold
skinparam classFontSize 12
skinparam classAttributeFontStyle bold
skinparam classAttributeFontSize 12
skinparam arrowThickness 1.5
skinparam arrowColor black
skinparam shadowing false
skinparam monochrome true
skinparam linetype ortho
skinparam nodesep 30
skinparam ranksep 50

' ── TOP ROW ─────────────────────────────────────────────────────

together {
  entity "**tourism_places**" as tourism_places {
    * id : int <<PK>>
    --
    name : varchar
    category : varchar
    wereda : varchar
    kebele : varchar
  }

  entity "**hero_images**" as hero_images {
    * id : int <<PK>>
    --
    image_url : text
    title : varchar
    description : text
    display_order : int
    active : boolean
    created_at : timestamp
    updated_at : timestamp
  }
}

' ── MIDDLE ROW ──────────────────────────────────────────────────

together {
  entity "**road_infos**" as road_infos {
    * id : int <<PK>>
    --
    tourism_place_id : int <<FK>>
    name : varchar
    type : varchar
    description : text
    condition : varchar
    distance_by_car : decimal
    distance_by_foot : decimal
    distance_by_horse : decimal
    distance_by_plane : decimal
    total_distance : decimal
    active : boolean
    created_at : timestamp
    updated_at : timestamp
  }

  entity "**language_guiders**" as language_guiders {
    * id : int <<PK>>
    --
    tourism_place_id : int <<FK>>
    name : varchar
    languages : text[]
    experience : text
    contact_info : varchar
    active : boolean
    created_at : timestamp
    updated_at : timestamp
  }

  entity "**map_points**" as map_points {
    * id : int <<PK>>
    --
    tourism_place_id : int <<FK>>
    name : varchar
    type : varchar
    latitude : float
    longitude : float
    description : text
    created_at : timestamp
  }
}

' ── BOTTOM ROW ──────────────────────────────────────────────────

entity "**horse_services**" as horse_services {
  * id : int <<PK>>
  --
  road_info_id : int <<FK>>
  name : varchar
  description : text
  price_per_hour : decimal
  max_capacity : int
  active : boolean
  created_at : timestamp
  updated_at : timestamp
}

' ── HIDDEN ARROWS to force vertical layout ──────────────────────
tourism_places  -[hidden]down- road_infos
road_infos      -[hidden]down- horse_services

' ── REAL RELATIONSHIPS ──────────────────────────────────────────
tourism_places  ||--o{ road_infos         : "has"
tourism_places  ||--o{ language_guiders   : "has"
tourism_places  ||--o{ map_points         : "has"
road_infos      ||--o{ horse_services     : "offers"

@enduml
```

---

## Table Summary

| Page | Entities | Theme |
|------|----------|-------|
| **Page 1** | users, roles, user_role_assignments, refresh_tokens, login_attempts, account_lockouts, email_verification_tokens, password_reset_tokens, audit_log_entries | Authentication & Security |
| **Page 2** | tourism_places, tourism_images, tourism_ratings, tourism_views, hotels, hotel_images, hotel_ratings, booking_statuses, hotel_bookings, booking_messages | Tourism & Booking |
| **Page 3** | road_infos, horse_services, language_guiders, map_points, hero_images | Roads, Services & Media |

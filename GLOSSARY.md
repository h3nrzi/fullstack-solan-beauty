# Beauty Salon Operations Domain

Shared vocabulary for bookings, service delivery, operational accounting of the salon and its future branches.

## Language

**Artist**:
Professional service provider with a defined specialty, working schedule, and commission agreement.
_Avoid_: User, human resource (when referring to service provider)

**Branch**:
Operational salon unit that can have independent staff, calendar, inventory, and cash register under central management.
_Avoid_: Independent business, tenant

**Multi-Service Booking**:
A booking for multiple services received by a single customer where the time and artist for each service must satisfy execution constraints.
_Avoid_: Single long service (when referring to a suite of services)

**Service Phase**:
A segment of service execution whose duration and requirement for an artist or shared resources can differ from other segments.
_Avoid_: Independent service (when referring to a segment of the same service)

**Processing Time**:
Processing or waiting interval within a service, such as hair color processing; whether the artist can serve another customer during this interval depends on the service and salon policy.
_Avoid_: Guaranteed artist free time

**Shared Resource**:
Equipment or facility with limited capacity that service delivery depends on; such as facial beds, wash chairs, or bridal suite.
_Avoid_: Artist (when referring to equipment or space)

**Compatible Concurrent Services**:
Services for a single customer whose simultaneous execution is permitted with the required artists and adherence to operational and safety conditions.
_Avoid_: Any two simultaneous services

**Deposit**:
Amount collected prior to service delivery for booking, credited toward the final settlement, whose disposition upon cancellation or reschedule follows salon policy.
_Avoid_: Gift credit, reward wallet

**Commission Agreement**:
Agreement between the salon and artist regarding the artist's share of services, including percentages and rules for deducting material costs from the calculation base.
_Avoid_: Fixed percentage for all artists

**Tariff**:
Base rate or price range, duration, and deposit defined for a service in the salon or for a specific artist with established tenure; changing a tariff creates a new version and does not alter previously recorded history.
_Avoid_: Arbitrary pricing, editing prices of past bookings

**Opening Balance**:
Inventory or open liability at the start of operations transferred from a previous state, reconciled with relevant officers, and approved by management.
_Avoid_: Initial bonus, hypothetical amount

**Commission Base**:
The amount to which the artist's contract percentage is applied; defaults to the greater of zero and the net service price after discounts minus deductible material costs.
_Avoid_: Total register receipts, net profit

**Salon Share After Materials and Commission**:
Remaining service revenue after discounts, material costs, and artist commission; other salon overheads have not yet been deducted.
_Avoid_: Net salon profit

**Salon-Borne Refund**:
Compensatory refund to the customer while preserving the validated service amount and artist commission; the financial burden is borne by the salon.
_Avoid_: Service price adjustment, automatic commission reduction

**Service Amount Adjustment**:
Adjustment to the validated service amount which also modifies the commission calculation base for that service under the established contract.
_Avoid_: Salon compensatory payout, unrecorded settlement edit

**Customer Prepayment**:
Funds received prior to service revenue realization that have not yet been applied toward rendered services.
_Avoid_: Realized revenue, salon profit

**Suspended Consumption**:
Actual recorded material consumption whose quantity and cost have not yet been finalized due to inventory discrepancy.
_Avoid_: Negative inventory, finalized consumption

**Deposit Credit**:
A paid deposit balance whose right of use is preserved without expiration for future bookings by the same customer, for any service and artist of the same salon; distinct from customer rewards.
_Avoid_: Gift credit, reward wallet

**Consultation Request**:
A customer request for evaluation and consultation regarding a service whose required duration or resource capacity is not yet reliable; does not create a confirmed booking, capacity hold, or booking deposit.
_Avoid_: Confirmed booking, confirmed appointment

**Photo Publication Consent**:
Explicit and independent consent from the customer for promotional use of their image with specific purpose, distribution channel, and duration; distinct from consultation image review consent and revocable.
_Avoid_: Permanent consent, consultation consent (when referring to advertising permission)

**Booking Service Item**:
A distinct service for a customer within a booking, with an independent artist, schedule, and execution status; may itself comprise multiple service phases.
_Avoid_: Service phase (when referring to an entire booked service)

**Visit Invoice**:
The collection of financial line items for services rendered during a visit, establishing the receivable amount and customer balance, and potentially spanning multiple artists.
_Avoid_: Receipt of funds, commission settlement

**Payment Allocation**:
A designated portion of a received payment credited toward a specific invoice line item; a single payment may have multiple allocations.
_Avoid_: Service revenue, undocumented deposit transfer

**Halted Service**:
A service whose execution started but ended prior to completion; distinct from pre-execution cancellation and completed verified service.
_Avoid_: Completed service, pre-execution cancellation

**Service Execution Verification**:
Operational confirmation by authorized reception staff that a service item was actually performed; independent of the artist's self-reported completion.
_Avoid_: Artist completion declaration, funds collection

**Halted Service Resolution Record**:
Agreed financial outcome document for a service halted prior to completion, with customer acceptance and authorized documented decision; does not alter the halted execution status.
_Avoid_: Full service invoice, cancellation penalty

**Final Price Rejection**:
Rejection by the customer of the proposed final service price prior to execution start; distinct from no-show and rendered service, with deposit disposition governed by accepted booking terms.
_Avoid_: No-show, rendered service

**Customer Session**:
A valid, time-bound credential resulting from successful OTP authentication, tied to a persistent customer identity, providing secure access to personal data and operations without exposure to or modification of other users' data.
_Avoid_: Public token, permanent session

**Customer OTP**:
A short-lived, single-use numeric code with attempt limits sent via SMS for customer authentication, invalidated upon use or expiration.
_Avoid_: Static password, permanent auth code

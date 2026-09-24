# Attendance

Attendance uses tenant-scoped policies, shift windows, immutable punch events, and a calculated daily record. Punches support clock-in, clock-out, and paired breaks. Overnight shifts use the next calendar day for their scheduled end. Calculation is pure and testable: first-in, last-out, break minutes, net work minutes, late minutes, and early-departure minutes are derived from the event stream.

Regularization requests reference one attendance record and enter the generic approval engine. An approved request replaces the record's in/out values and marks it `regularized`; rejection leaves the source record unchanged.

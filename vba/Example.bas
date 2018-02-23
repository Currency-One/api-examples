Attribute VB_Name = "Mod1"
Declare Sub MessageBeep Lib "User" (ByVal N As Integer)
Declare Function CoCreateGuid Lib "ole32" (ByRef GUID As Byte) As Long
Type SYSTEMTIME
wYear As Integer
wMonth As Integer
wDayOfWeek As Integer
wDay As Integer
wHour As Integer
wMinute As Integer
wSecond As Integer
wMilliseconds As Integer
End Type
Declare Sub GetSystemTime Lib "kernel32" (lpSystemTime As SYSTEMTIME)

Public Function GenerateGUID() As String

    Dim ID(0 To 15) As Byte
    Dim N As Long
    Dim GUID As String
    Dim Res As Long
    Res = CoCreateGuid(ID(0))

    For N = 0 To 15
        GUID = GUID & IIf(ID(N) < 16, "0", "") & Hex$(ID(N))
        If Len(GUID) = 8 Or Len(GUID) = 13 Or Len(GUID) = 18 Or Len(GUID) = 23 Then
            GUID = GUID & "-"
        End If
    Next N
    GenerateGUID = GUID
End Function

Function request(method As String, uri As String, apiKey As String, secret As String) As String
Dim timestamp As String, signature As String, toSign As String
Dim tSystem As SYSTEMTIME
GetSystemTime tSystem
Set xmlhttp = CreateObject("MSXML2.serverXMLHTTP")
Set hs = New HS256
hs.InitHmac hs.ToUTF8(secret)

timestamp = (DateDiff("s", "1/1/1970", Now) - 3600) * 1000 + tSystem.wMilliseconds
body = ""
toSign = uri & timestamp & body
signature = hs.Encode(hs.HmacSha256(hs.ToUTF8(toSign)))

xmlhttp.Open method, "https://api.walutomat.pl" & uri, False
xmlhttp.setRequestHeader "X-API-KEY", apiKey
xmlhttp.setRequestHeader "X-API-NONCE", timestamp
xmlhttp.setRequestHeader "X-API-SIGNATURE", signature

xmlhttp.Send
request = xmlhttp.responseText
End Function

Public Sub Example()

Dim xmlhttp As Object, apiKey As String, secret As String

apiKey = "..."
secret = "..."

MsgBox ("aktualne kursy: " & request("GET", "/api/v1/public/market/orderbook/EUR_PLN", apiKey, secret))

MsgBox ("dostepne saldo: " & request("GET", "/api/v1/account/balances", apiKey, secret))

'--- zlozenie oferty Kyp 1 PLN za EUR po kursie 4.5000 ---
offerDetails = "submitId=" & GenerateGUID() & _
    "&buySell=BUY" & _
    "&price=4.5000" & _
    "&volume=1.00" & _
    "&volumeCurrency=PLN" & _
    "&otherCurrency=EUR"
MsgBox ("zlozono oferte: " & request("POST", "/api/v1/market/orders/create?" & offerDetails, apiKey, secret))

'--- pobranie listy otwartych ofert:
Dim ordersJson As String, ordersDict As Variant, state As String
ordersJson = request("GET", "/api/v1/market/orders", apiKey, secret)
MsgBox ("otwarte zlecenia: " & ordersJson)

'--- anulowanie zlecenia (o ile jest jakies) ---
JSON.Parse ordersJson, ordersDict, state
If UBound(ordersDict) >= 0 Then
    orderId = ordersDict(0).Item("orderId") ' pobranie identyfikatora pierwszego otwartego zlecenia
    MsgBox ("anulowano oferte: " & request("POST", "/api/v1/market/orders/close/" & orderId, apiKey, secret))
Else
    MsgBox ("Brak otwartych ofert")
End If

End Sub

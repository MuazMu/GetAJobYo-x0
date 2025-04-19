"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Calculator } from "lucide-react"
import { convertCurrency, convertRatePeriod, formatCurrency, CURRENCY_SYMBOLS } from "@/lib/currency-utils"

export function SalaryCalculator() {
  const [amount, setAmount] = useState<number>(50000)
  const [fromCurrency, setFromCurrency] = useState<string>("USD")
  const [toCurrency, setToCurrency] = useState<string>("USD")
  const [fromPeriod, setFromPeriod] = useState<string>("yearly")
  const [toPeriod, setToPeriod] = useState<string>("yearly")
  const [result, setResult] = useState<number | null>(null)

  useEffect(() => {
    calculateConversion()
  }, [amount, fromCurrency, toCurrency, fromPeriod, toPeriod])

  const calculateConversion = () => {
    if (!amount || isNaN(amount)) {
      setResult(null)
      return
    }

    // First convert the rate period
    const amountInNewPeriod = convertRatePeriod(amount, fromPeriod, toPeriod)

    // Then convert the currency
    const amountInNewCurrency = convertCurrency(amountInNewPeriod, fromCurrency, toCurrency)

    setResult(amountInNewCurrency)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Salary Calculator
        </CardTitle>
        <CardDescription>Convert salary between currencies and payment periods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex">
              <div className="flex-none w-12 flex items-center justify-center border border-r-0 rounded-l-md bg-muted">
                {CURRENCY_SYMBOLS[fromCurrency] || "$"}
              </div>
              <Input
                id="amount"
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="rounded-l-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-currency">From Currency</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger id="from-currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                <SelectItem value="CNY">CNY (Chinese Yuan)</SelectItem>
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                <SelectItem value="BRL">BRL (Brazilian Real)</SelectItem>
                <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                <SelectItem value="MXN">MXN (Mexican Peso)</SelectItem>
                <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                <SelectItem value="SEK">SEK (Swedish Krona)</SelectItem>
                <SelectItem value="NZD">NZD (New Zealand Dollar)</SelectItem>
                <SelectItem value="TRY">TRY (Turkish Lira)</SelectItem>
                <SelectItem value="ETB">ETB (Ethiopian Birr)</SelectItem>
                <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                <SelectItem value="EGP">EGP (Egyptian Pound)</SelectItem>
                <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                <SelectItem value="GHS">GHS (Ghanaian Cedi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from-period">From Period</Label>
            <Select value={fromPeriod} onValueChange={setFromPeriod}>
              <SelectTrigger id="from-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-currency">To Currency</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger id="to-currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                <SelectItem value="CNY">CNY (Chinese Yuan)</SelectItem>
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                <SelectItem value="BRL">BRL (Brazilian Real)</SelectItem>
                <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                <SelectItem value="MXN">MXN (Mexican Peso)</SelectItem>
                <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                <SelectItem value="SEK">SEK (Swedish Krona)</SelectItem>
                <SelectItem value="NZD">NZD (New Zealand Dollar)</SelectItem>
                <SelectItem value="TRY">TRY (Turkish Lira)</SelectItem>
                <SelectItem value="ETB">ETB (Ethiopian Birr)</SelectItem>
                <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                <SelectItem value="EGP">EGP (Egyptian Pound)</SelectItem>
                <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                <SelectItem value="GHS">GHS (Ghanaian Cedi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-period">To Period</Label>
            <Select value={toPeriod} onValueChange={setToPeriod}>
              <SelectTrigger id="to-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Result</div>
            <div className="text-2xl font-bold">
              {result !== null ? formatCurrency(result, toCurrency) : "-"}
              <span className="text-sm text-muted-foreground ml-1">per {toPeriod.slice(0, -2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { saveFinancialModel } from "@/lib/services/reports";

interface FinancialCalculatorProps {
  suggestedSalary?: string; // e.g. "$60,000–$75,000" from report
  sessionId: string;
}

function parseSalaryMidpoint(range: string | undefined): number {
  if (!range) return 65000;
  const numbers = range.replace(/[^0-9–-]/g, "").split(/[–-]/);
  const values = numbers.map((n) => parseInt(n.replace(/\D/g, ""), 10)).filter(Boolean);
  if (values.length === 0) return 65000;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FinancialCalculator({ suggestedSalary, sessionId }: FinancialCalculatorProps) {
  const defaultSalary = parseSalaryMidpoint(suggestedSalary);

  const [baseSalary, setBaseSalary] = useState(defaultSalary);
  const [benefitsPct, setBenefitsPct] = useState(25);
  const [toolsCost, setToolsCost] = useState(2400);
  const [mgmtHours, setMgmtHours] = useState(5);
  const [yourHourlyRate, setYourHourlyRate] = useState(150);
  const [expectedRevenue, setExpectedRevenue] = useState(0);

  // Debounced save — persists inputs to report_data for admin review (US-012)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveFinancialModel(sessionId, {
        base_salary: baseSalary,
        benefits_pct: benefitsPct,
        tools_cost: toolsCost,
        mgmt_hours: mgmtHours,
        your_hourly_rate: yourHourlyRate,
        expected_revenue: expectedRevenue,
      });
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [sessionId, baseSalary, benefitsPct, toolsCost, mgmtHours, yourHourlyRate, expectedRevenue]);

  const salaryWarning = baseSalary < 15000;

  const calc = useMemo(() => {
    const benefitsCost = Math.round(baseSalary * (benefitsPct / 100));
    const mgmtCostAnnual = mgmtHours * yourHourlyRate * 52;
    const fullyLoaded = baseSalary + benefitsCost + toolsCost + mgmtCostAnnual;
    const breakEven = fullyLoaded - expectedRevenue;
    const monthsToBreakEven =
      expectedRevenue > 0 ? Math.ceil((fullyLoaded / (expectedRevenue / 12)) * 12) : null;

    return { benefitsCost, mgmtCostAnnual, fullyLoaded, breakEven, monthsToBreakEven };
  }, [baseSalary, benefitsPct, toolsCost, mgmtHours, yourHourlyRate, expectedRevenue]);

  const riskLevel =
    calc.monthsToBreakEven === null
      ? "unknown"
      : calc.monthsToBreakEven <= 6
      ? "low"
      : calc.monthsToBreakEven <= 12
      ? "medium"
      : "high";

  const riskColors = {
    unknown: "text-gray-600 bg-gray-50 border-gray-200",
    low: "text-green-700 bg-green-50 border-green-200",
    medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
    high: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Adjust the inputs below to model the fully-loaded cost of this hire and see when it
        breaks even.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Base Salary */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Base Salary (annual)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              step={1000}
              value={baseSalary}
              onChange={(e) => setBaseSalary(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {salaryWarning && (
            <p className="mt-1 text-xs text-amber-600">
              This seems low — double-check your numbers.
            </p>
          )}
        </div>

        {/* Benefits % */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Benefits &amp; Payroll Taxes — {benefitsPct}%
          </label>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={benefitsPct}
            onChange={(e) => setBenefitsPct(Number(e.target.value))}
            className="w-full accent-blue-600 mt-2"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0%</span>
            <span>20%</span>
            <span>40%</span>
          </div>
        </div>

        {/* Tools Cost */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Tools &amp; Software (annual)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              step={100}
              value={toolsCost}
              onChange={(e) => setToolsCost(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Management Time */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Your management time (hrs/week)
          </label>
          <input
            type="number"
            min={0}
            max={40}
            step={0.5}
            value={mgmtHours}
            onChange={(e) => setMgmtHours(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Your Hourly Rate */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Your hourly value (for mgmt cost calc)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              step={10}
              value={yourHourlyRate}
              onChange={(e) => setYourHourlyRate(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Expected Revenue Increase */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Expected revenue/margin increase (annual)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              step={5000}
              value={expectedRevenue}
              onChange={(e) => setExpectedRevenue(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Output Summary */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
        <h4 className="text-sm font-bold text-gray-800">Cost Breakdown</h4>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Base salary</span>
            <span className="font-medium">{formatCurrency(baseSalary)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Benefits &amp; taxes ({benefitsPct}%)</span>
            <span className="font-medium">{formatCurrency(calc.benefitsCost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tools &amp; software</span>
            <span className="font-medium">{formatCurrency(toolsCost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>
              Your management time ({mgmtHours}h/wk × {formatCurrency(yourHourlyRate)}/hr)
            </span>
            <span className="font-medium">{formatCurrency(calc.mgmtCostAnnual)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
            <span>Fully-loaded annual cost</span>
            <span>{formatCurrency(calc.fullyLoaded)}</span>
          </div>
        </div>

        {expectedRevenue > 0 && (
          <div className="border-t border-gray-200 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Expected revenue increase</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(expectedRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Net cost after revenue uplift</span>
              <span
                className={`font-medium ${
                  calc.breakEven <= 0 ? "text-green-600" : "text-gray-900"
                }`}
              >
                {calc.breakEven <= 0
                  ? `${formatCurrency(Math.abs(calc.breakEven))} profit`
                  : formatCurrency(calc.breakEven)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Risk Assessment */}
      <div className={`rounded-xl border p-4 text-sm ${riskColors[riskLevel]}`}>
        {riskLevel === "unknown" && (
          <p>
            <strong>Enter your expected revenue increase</strong> above to see how long this hire
            takes to break even.
          </p>
        )}
        {riskLevel === "low" && (
          <p>
            <strong>Low risk:</strong> Based on your numbers, this hire should break even within{" "}
            {calc.monthsToBreakEven} months. That&apos;s a strong return on investment.
          </p>
        )}
        {riskLevel === "medium" && (
          <p>
            <strong>Moderate risk:</strong> This hire needs to generate {formatCurrency(expectedRevenue)} in
            additional revenue within {calc.monthsToBreakEven} months. Make sure you have a clear
            plan for how this person will drive that growth.
          </p>
        )}
        {riskLevel === "high" && (
          <p>
            <strong>Higher risk:</strong> At current projections, this hire takes{" "}
            {calc.monthsToBreakEven} months to break even. Consider starting fractional to reduce
            commitment, or revisit your revenue assumptions.
          </p>
        )}
      </div>
    </div>
  );
}

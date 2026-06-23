import React, { createContext, useContext, useEffect, useState } from "react";
// import { loadMarketsByDay, type Market } from "../../services/marketService";
import userService, { type AccountFunds } from "../../services/userService";
import { type AxiosRequestConfig } from "axios";
import moment from "moment";
import { useAuth } from "./AuthContext";

interface RaceContextType {
  loading: boolean;
  // markets: Array<Market>;
  day: Date;
  dayDelta: number;
  accountFunds?: AccountFunds;
  refresh: boolean;
  increaseOneDay: () => void;
  increaseOneMonth: () => void;
  decreaseOneDay: () => void;
  decreaseOneMonth: () => void;
  loadMarkets: () => void;
  loadAccountFunds: (refresh?: boolean) => void;
  setRefresh: () => void;
}

const RaceContext = createContext<RaceContextType | null>(null);

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const RaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const [loadingCount, setLoadingCount] = React.useState<number>(0);
  // const [markets, setMarkets] = React.useState<Array<Market>>([]);
  const [accountFunds, setAccountFunds] = React.useState<AccountFunds>();
  const [day, setDay] = useState<Date>(getToday());

  const dayDelta = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((day.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [day]);

  const loading = React.useMemo(() => loadingCount > 0, [loadingCount]);

  const increaseOneDay = () => {
    setDay((value) => {
      const newDate = new Date(value);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const loadMarkets = React.useCallback(
    async (config?: AxiosRequestConfig) => {
      setLoadingCount((value) => value + 1);
      try {
        // const data = await loadMarketsByDay(dayDelta, config);
        // setMarkets(
        //   data
        //     .filter((market) => market.numberOfWinners === 1)
        //     .sort(
        //       (a, b) =>
        //         moment(a.startTime).valueOf() - moment(b.startTime).valueOf()
        //     )
        // );
      } finally {
        setLoadingCount((value) => value - 1);
      }
    },
    [dayDelta]
  );

  const loadAccountFunds = React.useCallback(
    async (refresh: boolean = false) => {
      setLoadingCount((value) => value + 1);
      try {
        const data = await userService.loadAccountFunds(refresh);
        setAccountFunds(data);
      } finally {
        setLoadingCount((value) => value - 1);
      }
    },
    []
  );

  useEffect(() => {
    if (token) {
      const controller = new AbortController();
      loadMarkets({ signal: controller.signal });
      return () => controller.abort();
    }
  }, [token, loadMarkets]);

  React.useEffect(() => {
    loadAccountFunds();
  }, [loadAccountFunds]);

  const increaseOneMonth = () => {
    setDay((value) => {
      const newDate = new Date(value);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const decreaseOneDay = () => {
    setDay((value) => {
      const newDate = new Date(value);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const decreaseOneMonth = () => {
    setDay((value) => {
      const newDate = new Date(value);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  return (
    <RaceContext.Provider
      value={{
        loading,
        // markets,
        day,
        dayDelta,
        accountFunds,
        refresh,
        increaseOneDay,
        increaseOneMonth,
        decreaseOneDay,
        decreaseOneMonth,
        loadMarkets,
        loadAccountFunds,
        setRefresh: () => setRefresh((value) => !value),
      }}
    >
      {children}
    </RaceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRace = () => useContext(RaceContext)!;
export default RaceProvider;

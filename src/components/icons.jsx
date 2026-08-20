import {
  MdAdd,
  MdClose,
  MdDashboard,
  MdDirectionsCar,
  MdEventNote,
  MdLogout,
  MdMenu,
  MdPayments,
  MdPeople,
  MdTrendingUp,
  MdVerified,
  MdCategory,
  MdTravelExplore,
} from 'react-icons/md';

const baseProps = {
  size: 16,
  'aria-hidden': true,
};

export function IconDashboard({ className }) {
  return <MdDashboard className={className} {...baseProps} />;
}

export function IconCars({ className }) {
  return <MdDirectionsCar className={className} {...baseProps} />;
}

export function IconBookings({ className }) {
  return <MdEventNote className={className} {...baseProps} />;
}

export function IconMenu({ className }) {
  return <MdMenu className={className} {...baseProps} />;
}

export function IconClose({ className }) {
  return <MdClose className={className} {...baseProps} />;
}

export function IconLogout({ className }) {
  return <MdLogout className={className} {...baseProps} />;
}

export function IconUsers({ className }) {
  return <MdPeople className={className} {...baseProps} />;
}

export function IconPayments({ className }) {
  return <MdPayments className={className} {...baseProps} />;
}

export function IconPlus({ className }) {
  return <MdAdd className={className} {...baseProps} />;
}

export function IconTrend({ className }) {
  return <MdTrendingUp className={className} {...baseProps} />;
}

export function IconVerified({ className }) {
  return <MdVerified className={className} {...baseProps} />;
}

export function IconCategories({ className }) {
  return <MdCategory className={className} {...baseProps} />;
}

export function IconSeo({ className }) {
  return <MdTravelExplore className={className} {...baseProps} />;
}

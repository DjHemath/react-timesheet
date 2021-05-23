import React, { Component } from 'react';
import "./CustomTable.css";

class DateTime {
    static months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    static getMonthStartAndMonthEnd(month) {
        const day = new Date();
        day.setMonth(month);
        
        const monthStart = new Date(day.getFullYear(), day.getMonth(), 1);

        const monthEnd = new Date(day.getFullYear(), day.getMonth()+1, 0);

        return {monthStart, monthEnd};
    }

    static getDayString(day) {
        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];
        return days[day];
    }

    static formatDate(date) {
        const today = new Date(date);
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear();
        return dd + '/' + mm + '/' + yyyy;
    }
}

export class CustomTable extends Component {

    constructor(props) {
        super(props);

        this.setStartAndEndTime();
        this.SLOT_INTERVAL_MINUTES = 5;

        this.state = {
            slots: [],
            rows: [],
            month: new Date().getMonth(),
            dateRange: [],
            selectedDateRange: 'full'
        }
    }

    setStartAndEndTime() {
        this.START_TIME = new Date();
        this.START_TIME.setHours(6);
        this.START_TIME.setMinutes(0);

        this.END_TIME = new Date();
        this.END_TIME.setHours(23);
        this.END_TIME.setMinutes(59);
    }

    setDateRange(month) {
        return new Promise((resolve, _) => {
            const { monthStart, monthEnd } = DateTime.getMonthStartAndMonthEnd(month);

            const day15 = new Date(monthStart);
            day15.setDate(day15.getDate() + 14);

            const dateRange = [
                {
                    id: 'full',
                    text: "Full",
                    start: monthStart,
                    end: monthEnd
                },
                {
                    id: 'first-half',
                    text: 'First Half',
                    start: monthStart,
                    end: day15
                },
                {
                    id: 'second-half',
                    text: 'Second Half',
                    start: day15,
                    end: monthEnd
                },
            ];

            this.setState({ dateRange }, resolve);
        });
    }

    async componentDidMount() {
        await this.buildSlots();
        await this.setDateRange(new Date().getMonth());
        const {monthStart, monthEnd} = DateTime.getMonthStartAndMonthEnd(this.state.month);
        this.buildRows(monthStart, monthEnd);
    }

    buildRow = (date) => {
        const startHour = this.START_TIME.getHours();
        const startMinute = this.START_TIME.getMinutes();
        const endHour = this.END_TIME.getHours();
        const endMinute = this.END_TIME.getMinutes() - ((this.END_TIME.getMinutes()) % 5);

        const slots = this.state.slots.map((slot) => ({
            ...slot,
            id: slot.string,
            checked: ((slot.hour >= startHour && slot.hour <= endHour) && (slot.minute >= startMinute && slot.minute <= endMinute))
        }));

        return {
            id: date.toLocaleDateString(),
            date,
            startHour,
            startMinute,
            endHour,
            endMinute,
            slots
        }
    }

    buildRows(startDate, endDate) {
        const numberOfDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        let date = new Date(startDate);
        const rows = [];

        for(let i=0; i<=numberOfDays; i++) {
            const row = this.buildRow(date);
            rows.push(row);
            date = new Date(date);
            date.setDate(date.getDate() + 1);
        }

        this.setState({ rows });
    }

    buildSlots() {
        return new Promise((resolve, _) => {
            const slots = [];
            for(let i=this.START_TIME.getHours(); i<=this.END_TIME.getHours(); i++) {
                for(let j=0; j<=55; j+=this.SLOT_INTERVAL_MINUTES) {
                    const hour = Number(i).toString().padStart(2, 0);
                    const minute = Number(j).toString().padStart(2, 0);
                    slots.push({
                        hour,
                        minute,
                        string: `${hour}:${minute}`
                    });
                }
            }
            this.setState({ slots }, () => resolve());
        });
    }

    onMonthChange = async (e) => {
        const month = e.target.value;
        await this.setDateRange(month);
        const dateRange = this.state.dateRange.find(range => range.id === this.state.selectedDateRange);
        this.buildRows(dateRange.start, dateRange.end);
        this.setState({ month });
    }

    handleDateRangeChange = (e) => {
        const selectedDateRange = e.target.value;
        this.setState({ selectedDateRange });
        const dateRange = this.state.dateRange.find(range => range.id === selectedDateRange);
        this.buildRows(dateRange.start, dateRange.end);
    }

    getSlots(startHour, startMinute, endHour, endMinute) {
        startHour = parseInt(startHour);
        startMinute = parseInt(startMinute);
        endHour = parseInt(endHour);
        endMinute = parseInt(endMinute);
        const trueSlots = [];

        for(let i=startHour; i<=endHour; i++) {
            if(startHour === endHour) {
                for(let j=startMinute; j<=endMinute; j+=5) {
                    trueSlots.push({i,j});
                }
            } else if(i === startHour) {
                for(let j=startMinute; j<=55; j+=5) {
                    trueSlots.push({i,j});
                }
            } else if(i === endHour) {
                for(let j=0; j<=endMinute; j+=5) {
                    trueSlots.push({i,j});
                }
            } else {
                for(let j=0; j<=55; j+=5) {
                    trueSlots.push({i,j});
                }
            }
        }

        const slots = this.state.slots.map(slot => {
            const trueSlot = trueSlots.find(s => s.i === parseInt(slot.hour) && s.j === parseInt(slot.minute));
            slot.checked = false;
            if(trueSlot) {
                slot.checked = true;
            }
            slot.id = slot.string;
            return slot;
        });

        return slots;
    }

    handleStartHourChange = (id, hour) => {
        const rowsCopy = [...this.state.rows];
        const rows = rowsCopy.map(row => {
            if(row.id === id) {
                row.startHour = hour;
                row.slots = this.getSlots(row.startHour, row.startMinute, row.endHour, row.endMinute);
            }
            return row;
        });

        this.setState({ rows });
    }

    handleStartMinuteChange = (id, minute) => {
        const rowsCopy = [...this.state.rows];
        const rows = rowsCopy.map(row => {
            if(row.id === id) {
                row.startMinute = minute;
                row.slots = this.getSlots(row.startHour, row.startMinute, row.endHour, row.endMinute);
            }
            return row;
        });

        this.setState({ rows });
    }

    handleEndHourChange = (id, hour) => {
        const rowsCopy = [...this.state.rows];
        const rows = rowsCopy.map(row => {
            if(row.id === id) {
                row.endHour = hour;
                row.slots = this.getSlots(row.startHour, row.startMinute, row.endHour, row.endMinute);
            }
            return row;
        });

        this.setState({ rows });
    }

    handleEndMinuteChange = (id, minute) => {
        const rowsCopy = [...this.state.rows];
        const rows = rowsCopy.map(row => {
            if(row.id === id) {
                row.endMinute = minute;
                row.slots = this.getSlots(row.startHour, row.startMinute, row.endHour, row.endMinute);
            }
            return row;
        });

        this.setState({ rows });
    }

    handleCheckBoxChange = (rowId, slotId) => {
        const rowsCopy = [...this.state.rows];
        const rows = rowsCopy.map(row => {
            if(row.id === rowId) {
                const slots = row.slots.map(slot => {
                    if(slot.id === slotId) {
                        slot.checked = !(slot.checked)
                    }
                    return slot;
                })
                row.slots = slots;
            }
            return row;
        });

        this.setState({ rows });
    }

    render() {

        const hours = [];
        for(let i=this.START_TIME.getHours(); i<=this.END_TIME.getHours(); i++) {
            hours.push(
                <option key={i} value={i}>{i}</option>
            );
        }
        const minutes = [];
        for(let i=0; i<=55; i+= 5) {
            minutes.push(
                <option key={i} value={i}>{i}</option>
            );
        }

        return (
            <div className="custom-table">


                <div className="col-1">
                    <div className="head-row">
                        <select value={this.state.month} onChange={this.onMonthChange}>
                            {
                                DateTime.months.map((month, i) => (
                                    <option key={i} value={i}>{month}</option>
                                ))
                            }
                        </select>
                    </div>

                    {
                        this.state.rows.map((row, index) => (
                            <div className="row" key={index}>
                                <div>{DateTime.getDayString(row.date.getDay())}</div>
                                <div>{DateTime.formatDate(row.date)}</div>
                            </div>
                        ))
                    }
                </div>
                
                <div className="col-2">
                    <div className="head-row">
                        <select value={this.state.selectedDateRange} onChange={this.handleDateRangeChange}>
                            {
                                this.state.dateRange.map((range, index) => (
                                    <option key={index} value={range.id}>{range.text}</option>
                                ))
                            }
                        </select>

                        <div>
                            <div>Start (h)</div>
                            <div>Start (m)</div>
                            <div>End (h)</div>
                            <div>End (m)</div>
                        </div>
                    </div>

                    
                        {
                            this.state.rows.map((row, index) => (
                                <div className="row" key={index}>
                                    <select value={row.startHour} onChange={(e) => {this.handleStartHourChange(row.id, parseInt(e.target.value))}}>
                                        {hours}
                                    </select>
                                    <select value={row.startMinute} onChange={(e) => {this.handleStartMinuteChange(row.id, parseInt(e.target.value))}}>
                                        {minutes}
                                    </select>
                                    <select value={row.endHour} onChange={(e) => {this.handleEndHourChange(row.id, parseInt(e.target.value))}}>
                                        {hours}
                                    </select>
                                    <select value={row.endMinute} onChange={(e) => {this.handleEndMinuteChange(row.id, parseInt(e.target.value))}}>
                                        {minutes}
                                    </select>
                                </div>
                            ))
                        }
                </div>

                <div className="col-3">
                    <div className="head-row">
                        {
                            this.state.slots.map((slot, index) => (
                                <span key={index}>{slot.string}</span>
                            ))
                        }
                    </div>

                    {
                        this.state.rows.map((row, index) => (
                            <div className="row" key={index}>
                                {
                                    row.slots.map((slot, slotIndex) => (
                                        <div key={slotIndex}>
                                            <input onChange={() => this.handleCheckBoxChange(row.id, slot.id)} checked={slot.checked} type="checkbox"/>
                                        </div>
                                    ))
                                }
                            </div>
                        ))
                    }
                </div>
            </div>
        )
    }
}

export default CustomTable
